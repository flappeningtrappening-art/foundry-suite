import { z } from 'genkit';
import { ai } from '../genkit';
import { forensicTool } from '../tools/forensicTool';

export const realEstateFlow = ai.defineFlow(
  {
    name: 'realEstateFlow',
    inputSchema: z.object({
      address: z.string(),
      beds: z.union([z.string(), z.number()]),
      baths: z.union([z.string(), z.number()]),
      sqft: z.union([z.string(), z.number()]),
      price: z.union([z.string(), z.number()]),
      features: z.string(),
      tone: z.string(),
      styleSamples: z.array(z.string()).optional(),
      caseId: z.string().optional(),
      userId: z.string().optional(),
    }),
    outputSchema: z.object({
      listing: z.string(),
      sources: z.array(z.any()),
    }),
  },
  async (input) => {
    let styleInstructions = "";
    if (input.styleSamples && input.styleSamples.length > 0) {
      styleInstructions = `
      STYLE GUIDELINES:
      The user has provided the following samples of their writing style:
      ${input.styleSamples.map(s => `"${s}"`).join("\n")}

      CRITICAL INSTRUCTION: 
      - Analyze the *cadence*, *vocabulary*, and *sentence structure* of these samples.
      - Write the new listing in this same voice.
      - **DO NOT** copy any of the sample sentences verbatim. You must write 100% original copy that *feels* like the samples but repeats none of the text.
      `;
    }

    const forensicQuery = `
      TASK: Write a high-end, compelling real estate listing description for the property at ${input.address}.
      
      PROPERTY DATA (Manual):
      - Price: ${input.price}
      - Layout: ${input.beds} beds, ${input.baths} baths, ${input.sqft} sqft
      - Manual Features: ${input.features}
      - Desired Tone: ${input.tone}
      
      ${styleInstructions}
      
      FORENSIC GOAL: 
      1. Cross-reference the manual features above with the uploaded forensic documents (inspection reports/disclosures).
      2. If you find value-adds in the documents not mentioned manually, include them.
      3. If you find contradictions (e.g. manual entry says "New Roof" but report says "Repair Needed"), list the property accurately and add a section at the bottom titled "**FORENSIC RISK ALERT**" explaining the discrepancy.
      
      OUTPUT FORMAT:
      - A catchy headline.
      - 200-400 words of engaging copy.
      - Cite source page numbers if referencing specific report findings.
    `;

    // We call the tool directly (as a function) since we know exactly what we want to do.
    // Alternatively, we could let the LLM decide to call it, but for this specific flow,
    // we ALWAYS want to run the forensic analysis.
    const result = await forensicTool({
      query: forensicQuery,
      caseId: input.caseId,
      userId: input.userId,
      includeGeneralKnowledge: false
    });

    return {
      listing: result.report,
      sources: result.citations
    };
  }
);
