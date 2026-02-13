import { z } from 'genkit';
import { ai } from '../genkit';
import { forensicTool } from '../tools/forensicTool';

export const threadGeneratorFlow = ai.defineFlow(
  {
    name: 'threadGeneratorFlow',
    inputSchema: z.object({
      topic: z.string(),
      styleSamples: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      thread: z.string(),
    }),
  },
  async (input) => {
    let styleInstructions = "";
    if (input.styleSamples && input.styleSamples.length > 0) {
      styleInstructions = `
      CRITICAL: You must mimic the following writing style exactly. 
      Pay attention to the sentence length, vocabulary choice, use of emojis, and overall rhythm.
      
      EXAMPLES OF THE TARGET STYLE:
      ${input.styleSamples.map((s, i) => `Sample ${i+1}: "${s}"`).join("\n\n")}
      
      Now, apply this exact style to the new thread below.`;
    }

    const query = `You are an expert content creator specializing in viral Twitter threads.
    Your task is to generate a compelling, engaging, and well-structured Twitter thread based on the following topic.

    Topic: "${input.topic}"
    ${styleInstructions}

    Instructions:
    1.  **Hook:** Start with a strong, attention-grabbing hook in the first tweet.
    2.  **Structure:** The thread must have between 5 and 10 tweets.
    3.  **Numbering:** Each tweet in the thread should be numbered (e.g., 1/, 2/, 3/).
    4.  **Clarity:** Write in a clear, concise, and easy-to-read style. Use simple language.
    5.  **Formatting:** Use line breaks and emojis to improve readability.
    6.  **Hashtags:** Include 2-3 relevant hashtags at the end of the last tweet.
    7.  **CTA:** End the thread with a clear call-to-action.
    8.  **Output Format:** Separate each tweet with two newline characters ('\n\n').

    Generate the thread now.`;

    const result = await forensicTool({
      query: query,
      includeGeneralKnowledge: true // Use the brain's knowledge base
    });

    return { thread: result.report };
  }
);
