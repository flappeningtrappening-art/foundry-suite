import { z } from 'genkit';
import { ai, gemini20 } from '../genkit';

/**
 * BASICGLITCH NEURAL FORGE FLOW
 * ==========================================
 * Generates signature visions based on Broboticus and PCB aesthetics.
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
    // BasicGlitch Aesthetic Protocol
    const protocol = {
      PCB_FRACTAL: "Intricate gold and cyan PCB traces, micro-circuitry fractals, mathematical precision, motherboard architecture.",
      NEON_SURREAL: "Vivid neon saturation, melting digital structures, high-contrast cyan/magenta palette, ethereal digital decay.",
      BROBOTICUS_VOID: "Cyberpunk robot character, soul-infused machinery, wireframe halo, deep black void background with glowing embers."
    };

    const basePrompt = `BASICGLITCH_SIGNAL_INPUT: "${input.neuralSeed}"
    INFUSION_PROTOCOL: ${protocol[input.infusionType]}
    
    Aesthetic Requirements:
    - High-saturation Tech-Noir style.
    - Professional digital surrealism.
    - Uncompromising design, high-fidelity details.
    - Cinematic lighting, bioluminescent glows.
    
    Final Image Directive: Create a high-definition vision that captures the intersection of technological artifact and organic dream.`;

    const response = await ai.generate({
      prompt: basePrompt,
      model: gemini20, 
    });

    // In a real production scenario with Imagen, we would return the actual media URL
    // For now, we return a high-fidelity description and a placeholder vision
    return {
      imageUrl: "https://basicglitch.art/assets/images/raw/guitarbot_og.png", // Placeholder
      forensicLog: response.text,
    };
  }
);
