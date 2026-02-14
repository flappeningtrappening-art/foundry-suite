import express from 'express';
import * as process from 'process';

const app = express();
app.use(express.json());

const PORT = 3400;

console.log('--- [FOUNDRY PRODUCTION SERVER - EXPRESS CORE V3] ---');

/**
 * VISUAL FORGE ENDPOINT
 */
app.post('/visualForgeFlow', async (req, res) => {
  const { data } = req.body;
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const model = "gemini-2.5-flash"; 
  const basePrompt = `BASICGLITCH_SIGNAL_INPUT: "${data.neuralSeed}"\nINFUSION_PROTOCOL: ${data.infusionType}\nCreate a high-definition Tech-Noir vision description.`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: basePrompt }] }] })
    });
    const result: any = await response.json();
    const forensicLog = result.candidates[0].content.parts[0].text;

    // POLLINATIONS.AI INTEGRATION (Zero-Waste Real Image Generation)
    // We encode the high-fidelity vision and append aesthetic boosters
    const encodedPrompt = encodeURIComponent(`${forensicLog.substring(0, 500)} | Tech-Noir style, high-saturation, 4k, cinematic lighting, detailed obsidian textures`);
    const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true`;

    res.json({
      result: {
        imageUrl: generatedImageUrl,
        forensicLog: forensicLog
      }
    });
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
    TASK: Generate POD (Print on Demand) metadata for the following design.
    DESIGN TOPIC: ${topic}
    
    OUTPUT JSON FORMAT:
    {
      "title": "Aggressive, high-search-volume title (max 60 chars)",
      "tags": "15-20 comma-separated tags, prioritized by search volume",
      "description": "Immersive, tech-noir storytelling description (150 words) that includes the tags naturally."
    }
    
    STRICT: Return ONLY the JSON object.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: podPrompt }] }] })
    });
    const result: any = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    res.json(JSON.parse(jsonMatch[0].trim()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`SUCCESS: Foundry Production Server is running on port ${PORT}`);
});
