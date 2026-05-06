'use server';
/**
 * @fileOverview An AI agent for suggesting transaction categories.
 *
 * - suggestCategories - A function that suggests categories for a given transaction.
 * - SuggestCategoriesInput - The input type for the suggestCategories function.
 * - SuggestCategoriesOutput - The return type for the suggestCategories function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestCategoriesInputSchema = z.object({
  description: z.string().describe('A detailed description of the transaction or keywords related to it.'),
  existingCategories: z.array(z.string()).optional().describe('An optional list of categories already defined by the user to use as context for suggestions.'),
});
export type SuggestCategoriesInput = z.infer<typeof SuggestCategoriesInputSchema>;

const PromptInputSchema = z.object({
  description: z.string(),
  categoriesContext: z.string().optional(),
});

const SuggestCategoriesOutputSchema = z.object({
  suggestedCategories: z.array(z.string()).describe('A list of suggested categories for the transaction, ordered by relevance.'),
});
export type SuggestCategoriesOutput = z.infer<typeof SuggestCategoriesOutputSchema>;

export async function suggestCategories(input: SuggestCategoriesInput): Promise<SuggestCategoriesOutput> {
  return suggestCategoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoriesPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: SuggestCategoriesOutputSchema },
  prompt: `You are an AI assistant specialized in financial transaction categorization. Your goal is to suggest relevant categories for a given transaction based on its description.

Here is the transaction description: "{{{description}}}"

{{#if categoriesContext}}
Consider the following existing categories as a guide, but also suggest new ones if appropriate: {{{categoriesContext}}}
{{/if}}

Provide up to 5 suggested categories, ordered by relevance, in a JSON array format. Prioritize common financial categories and be concise. Only return the JSON array, nothing else.
`,
});

const suggestCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestCategoriesFlow',
    inputSchema: SuggestCategoriesInputSchema,
    outputSchema: SuggestCategoriesOutputSchema,
  },
  async (input) => {
    const categoriesContext = input.existingCategories?.length 
      ? input.existingCategories.join(', ') 
      : undefined;

    const { output } = await prompt({
      description: input.description,
      categoriesContext
    });
    return output!;
  }
);
