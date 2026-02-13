import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import * as process from 'process';

// Shared Genkit Instance
export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
  })],
});

// Manually define the model to bypass Genkit 0.9.x static list
export const gemini20 = ai.defineModel({
  name: 'googleai/gemini-2.0-flash',
  label: 'Gemini 2.0 Flash',
});
