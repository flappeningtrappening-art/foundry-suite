import { genkit } from 'genkit';
import * as process from 'process';

// Shared Genkit Instance (Minimalist Bypass Mode)
// We remove all plugins to avoid the 'registry.listActions' bug in 1.x
export const ai = genkit({
  plugins: [], 
});
