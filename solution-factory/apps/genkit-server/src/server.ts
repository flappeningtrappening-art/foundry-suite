import express from 'express';
import cors from 'cors';
import * as process from 'process';

const app = express();
app.use(cors()); 
app.use(express.json());

const PORT = 3400;

console.log('--- [FOUNDRY PRODUCTION SERVER - MASTER CORE] ---');

/**
 * HEALTH CHECK
 */
app.get('/health', (req, res) => res.send('OK'));

/**
 * VISUAL FORGE ENDPOINT
 */
app.post('/visualForgeFlow', async (req, res) => {
  const { data } = req.body;
  if (!data || !data.neuralSeed) return res.status(400).json({ error: "Missing data.neuralSeed" });

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  let model = "gemini-2.5-flash"; 
  const basePrompt = `BASICGLITCH_SIGNAL_INPUT: "${data.neuralSeed}"\nINFUSION_PROTOCOL: ${data.infusionType}\nCreate a high-definition Tech-Noir vision description.`;

  async function callGemini(modelId: string) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: basePrompt }] }] })
    });
    const result: any = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result.candidates[0].content.parts[0].text;
  }

  try {
    let forensicLog;
    try {
      forensicLog = await callGemini("gemini-2.5-flash");
    } catch (e: any) {
      console.warn("[QUOTA] Gemini 2.5 Exhausted, attempting 2.0-Flash...");
      try {
        forensicLog = await callGemini("gemini-2.0-flash");
      } catch (e2: any) {
        console.warn("[QUOTA] Gemini 2.0 Exhausted, attempting 3-Flash-Preview...");
        forensicLog = await callGemini("gemini-3-flash-preview");
      }
    }

    // POLLINATIONS.AI INTEGRATION (Optimized)
    const cleanSubject = data.neuralSeed.substring(0, 100);
    const infusionBoost = data.infusionType === 'BROBOTICUS_VOID' ? 'Cyberpunk robot, obsidian glass, void background' : 
                         data.infusionType === 'NEON_SURREAL' ? 'Vivid neon colors, melting digital textures' : 
                         'Intricate PCB circuitry, gold fractals';

    const imagePrompt = `${cleanSubject}, ${infusionBoost}, tech-noir style, cinematic lighting, 4k, hyper-detailed`;
    const encodedPrompt = encodeURIComponent(imagePrompt);
    const randomSeed = Math.floor(Math.random() * 1000000);
    const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${randomSeed}`;

    res.json({
      result: {
        imageUrl: generatedImageUrl,
        forensicLog: forensicLog
      }
    });
  } catch (error: any) {
    console.error("[FORGE ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * FOUNDRY X - VIRAL THREAD ENGINE
 */
app.post('/foundryX', async (req, res) => {
  const { topic, samples } = req.body;
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const model = "gemini-2.5-flash"; 

  const threadPrompt = `
    ROLE: Expert Content Strategist / Tech-Noir Ghostwriter.
    TASK: Generate a 7-tweet viral Twitter thread.
    TOPIC: ${topic}
    SAMPLES: ${samples || 'Foundry Standard'}
    INSTRUCTIONS: Number each tweet (1/7, 2/7, etc). Use aggressive, high-stakes tone. Include emojis.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: threadPrompt }] }] })
    });
    const result: any = await response.json();
    res.json({ thread: result.candidates[0].content.parts[0].text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POD SEO METADATA ENGINE
 */
app.post('/podSEO', async (req, res) => {
  const { topic } = req.body;
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const model = "gemini-2.5-flash"; 

  const podPrompt = `
    TASK: Generate POD metadata for: ${topic}
    OUTPUT JSON ONLY: {"title": "...", "tags": "...", "description": "..."}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: podPrompt }] }] })
    });
    const result: any = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    res.json(JSON.parse(jsonMatch[0].trim()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SUCCESS: Master Production Server is running on http://0.0.0.0:${PORT}`);
});
