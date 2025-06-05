import { describe, it, expect } from 'vitest';
import { answerRelevancyAgent, answerRelevancyEval } from './answer-relevancy';

describe('Answer Relevancy Tests', () => {
    const testCases = [
        {
            query: "How do I reset my TechGadget X200 to factory settings?",
        },
        {
            query: "When will the new TechGadget X300 be released?",
        },
        {
            query: "Do you offer international shipping?",
        }
    ];

    testCases.forEach(({ query }) => {
        it(`should provide relevant answers for: ${query}`, async () => {
            // Get the agent's response
            const response = await answerRelevancyAgent.generate(query);

            // Evaluate the relevancy of the response
            const relevancyScore = await answerRelevancyEval.measure(
                query,
                response.text,
            );

            console.log('Input:', query)
            console.log('Response:', response.text)
            console.log('Reason:', relevancyScore.info.reason)
            console.log('Score:', relevancyScore.score)

            // Assert that the relevancy score is above a reasonable threshold
            expect(relevancyScore.score).toBeGreaterThan(0.0);
        }, 60000);
    });
});