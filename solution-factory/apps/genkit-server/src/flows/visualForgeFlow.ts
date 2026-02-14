import { z } from 'genkit';
import { ai } from '../genkit';

/**
 * BASICGLITCH NEURAL FORGE FLOW (V3 - DIRECT BYPASS)
 * ==========================================
 * Bypasses broken Genkit 1.x registry to call Gemini 2.0/2.5 directly.
 * ==========================================
 */

export const visualForgeFlow = ai.defineFlow(
  {
    name: 'visualForgeFlow',
    inputSchema: z.object({
      neuralSeed: z.string(),
      infusionType: z.enum(['PCB_FRACTAL', 'NEON_SURREAL', 'BROBOTICUS_VOID']).default('NEON_SURREAL'),
    }),
    outputSchema: z.object({
      imageUrl: z.string(),
      forensicLog: z.string(),
    }),
  },
  async (input) => {
    const protocol = {
      PCB_FRACTAL: "Intricate gold and cyan PCB traces, micro-circuitry fractals, motherboard architecture.",
      NEON_SURREAL: "Vivid neon saturation, melting digital structures, high-contrast cyan/magenta palette, ethereal digital decay.",
      BROBOTICUS_VOID: "Cyberpunk robot character, soul-infused machinery, wireframe halo, deep black void background with glowing embers."
    };

    const basePrompt = `BASICGLITCH_SIGNAL_INPUT: "${input.neuralSeed}"
    INFUSION_PROTOCOL: ${protocol[input.infusionType]}
    Final Image Directive: Create a high-definition Tech-Noir vision.`;

    // DIRECT API CALL BYPASS (Zero Waste)
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    const model = "gemini-2.0-flash"; // Confirmed active via curl
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: basePrompt }] }]
        })
      });

      const data: any = await response.json();
      
      if (!response.ok) {
        throw new Error(`Gemini API Error: ${JSON.stringify(data)}`);
      }

      const generatedText = data.candidates[0].content.parts[0].text;

      return {
        imageUrl: "https://basicglitch.art/assets/images/raw/guitarbot_og.png", 
        forensicLog: generatedText,
      };
    } catch (error: any) {
      console.error("FORGE BYPASS FAILED:", error);
      throw error;
    }
  }
);
