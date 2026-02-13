import { z } from 'genkit';
import { ai } from '../genkit';
import { forensicTool } from '../tools/forensicTool';

export const coldEmailFlow = ai.defineFlow(
  {
    name: 'coldEmailFlow',
    inputSchema: z.object({
      recipientInfo: z.string(),
      myProduct: z.string(),
      valueProp: z.string(),
      cta: z.string(),
      tone: z.string(),
      styleSamples: z.array(z.string()).optional(),
      caseId: z.string().optional(),
      userId: z.string().optional(),
    }),
    outputSchema: z.object({
      email: z.string(),
      sources: z.array(z.any()),
    }),
  },
  async (input) => {
    let styleInstructions = "";
    if (input.styleSamples && input.styleSamples.length > 0) {
      styleInstructions = `STYLE REQUIREMENTS: Mimic this voice exactly: ${input.styleSamples.join("\n")}`;
    }

    const forensicQuery = `
      TASK: Write a world-class, high-conversion cold email.
      
      RECIPIENT CONTEXT: ${input.recipientInfo}
      WHAT I OFFER: ${input.myProduct}
      KEY VALUE PROP: ${input.valueProp}
      CTA: ${input.cta}
      TONE: ${input.tone}
      
      ${styleInstructions}
      
      FORENSIC GOAL: 
      1. Cross-reference the recipient info with the uploaded forensic documents (e.g. Annual Reports, News Articles).
      2. Find a specific "Nugget of Truth" (a pain point, a recent achievement, or a quote) from the documents.
      3. Use that nugget in the opening hook to prove this is NOT a mass-blast email.
      4. If documents are missing, write a high-quality personalized draft based on the manual info. 
      
      OUTPUT FORMAT:
      - Subject Line (Max 5 words)
      - Email Body (Max 150 words)
      - Cite source page numbers if referencing specific document findings.
    `;

    const result = await forensicTool({
      query: forensicQuery,
      caseId: input.caseId,
      userId: input.userId,
      includeGeneralKnowledge: true // Outreach benefits from web search
    });

    return {
      email: result.report,
      sources: result.citations
    };
  }
);
