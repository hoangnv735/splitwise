// 'use server'
'use server';
/**
 * @fileOverview AI flow to suggest expense attributions based on the description and participants.
 *
 * - suggestAttributions - A function that suggests expense attributions.
 * - SuggestAttributionsInput - The input type for the suggestAttributions function.
 * - SuggestAttributionsOutput - The return type for the suggestAttributions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAttributionsInputSchema = z.object({
  description: z.string().describe('The description of the expense.'),
  participants: z.array(z.string()).describe('The names of the picnic participants.'),
});
export type SuggestAttributionsInput = z.infer<typeof SuggestAttributionsInputSchema>;

const SuggestAttributionsOutputSchema = z.record(z.string(), z.number().min(0).max(1)).describe('A map of participant name to attribution score (0 to 1).');
export type SuggestAttributionsOutput = z.infer<typeof SuggestAttributionsOutputSchema>;

export async function suggestAttributions(input: SuggestAttributionsInput): Promise<SuggestAttributionsOutput> {
  return suggestAttributionsFlow(input);
}

const suggestAttributionsPrompt = ai.definePrompt({
  name: 'suggestAttributionsPrompt',
  input: {schema: SuggestAttributionsInputSchema},
  output: {schema: SuggestAttributionsOutputSchema},
  prompt: `Given the following expense description and list of participants, determine how likely each participant is to be attributed to the expense. Return a JSON object where the keys are participant names and the values are attribution scores between 0 and 1 (inclusive), where 0 means not at all likely and 1 means very likely. The scores should reflect how much the participant benefited from the expense.

Expense Description: {{{description}}}
Participants: {{#each participants}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
`,
});

const suggestAttributionsFlow = ai.defineFlow(
  {
    name: 'suggestAttributionsFlow',
    inputSchema: SuggestAttributionsInputSchema,
    outputSchema: SuggestAttributionsOutputSchema,
  },
  async input => {
    const {output} = await suggestAttributionsPrompt(input);
    return output!;
  }
);
