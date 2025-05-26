
import {genkit} from 'genkit';
// Removed Google AI plugin as AI features are being removed.
// import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    // googleAI() // Removed
  ],
  // Model selection is irrelevant if no model-based plugins are used.
  // model: 'googleai/gemini-2.0-flash',
});
