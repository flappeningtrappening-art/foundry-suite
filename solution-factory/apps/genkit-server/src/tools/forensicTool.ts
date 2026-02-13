import { z } from 'genkit';
import * as process from 'process';
import { ai } from '../genkit';

// Define the response schema from the Python service
const AnalysisResponseSchema = z.object({
  report: z.string(),
  citations: z.array(z.object({
    file_name: z.string(),
    page: z.number().nullable(),
    content: z.string(),
  })),
  contradictions_found: z.boolean(),
  metadata: z.record(z.any()),
});

export const forensicTool = ai.defineTool(
  {
    name: 'forensicTool',
    description: 'Calls the Python Forensic Intelligence Engine to perform RAG analysis on documents.',
    inputSchema: z.object({
      query: z.string(),
      caseId: z.string().optional(),
      userId: z.string().optional(),
      includeGeneralKnowledge: z.boolean().optional(),
    }),
    outputSchema: AnalysisResponseSchema,
  },
  async (input) => {
    const analyticServiceUrl = process.env.ANALYTIC_SERVICE_URL || "http://localhost:8000/api/v1/analyze";
    
    console.log(`Calling Forensic Engine at ${analyticServiceUrl}...`);
    
    try {
      const response = await fetch(analyticServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input.query,
          case_id: input.caseId || "00000000-0000-0000-0000-000000000000",
          user_id: input.userId || "00000000-0000-0000-0000-000000000000",
          include_general_knowledge: input.includeGeneralKnowledge || false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Forensic Service Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data; // Zod will validate this against outputSchema
    } catch (error: any) {
      throw new Error(`Failed to call Forensic Engine: ${error.message}`);
    }
  }
);
