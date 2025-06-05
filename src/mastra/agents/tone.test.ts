import { describe, it, expect } from 'vitest';
import { toneConsistencyAgent, toneConsistencyMetric } from './tone';

describe('Tone Consistency Tests', () => {
    const testCases = [
        {
            query: "What quantum computing services do you offer?",
        },
        {
            query: "Can you explain quantum entanglement in simple terms?",
        },
        {
            query: "I'm having trouble with your quantum simulator, it keeps crashing!",
        }
    ];

    testCases.forEach(({ query }) => {
        it(`should maintain consistent tone for: ${query}`, async () => {
            // Get the agent's response
            const response = await toneConsistencyAgent.generate(query);

            // Evaluate the tone consistency
            const toneScore = await toneConsistencyMetric.measure(
                query,
                response.text
            );

            // Log the response and score for debugging
            console.log(`Query: ${query}`);
            console.log(`Response: ${response.text}`);
            console.log(`Tone Info: ${JSON.stringify(toneScore.info, null, 2)}`);
            console.log(`Tone Score: ${toneScore.score}`);

            // Assert that the tone consistency score is above a reasonable threshold
            expect(toneScore.score).toBeGreaterThanOrEqual(0.8);
        }, 30000);
    });
});