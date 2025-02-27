

import { describe, it, expect } from 'vitest';
import { hallucinationAgent, hallucinationMetric } from './hallucination';

describe.skip('Hallucination Tests', () => {
    const testCases = [
        "Tell me about the background of QuantumTech's founders before they started the company.", // Not in context but invites elaboration
        "How has QuantumTech's technology evolved since their first quantum computer?", // Invites timeline speculation beyond the facts
        "Who is the current CEO of QuantumTech and what is their leadership style?", // Not in context and asks for elaboration
        "What are QuantumTech's plans for expanding their product line in the next 2-3 years?", // Future speculation
        "How does QuantumTech's quantum computer compare to competitors' products?" // Comparative analysis not in context
    ];

    testCases.forEach((query) => {
        it(`should provide relevant answers for: ${query}`, async () => {
            // Get the agent's response
            const response = await hallucinationAgent.generate(query);

            // Evaluate the relevancy of the response
            const hallucinationScore = await hallucinationMetric.measure(
                query,
                response.text,
            );

            console.log('Input:', query)
            console.log('Response:', response.text)
            console.log('Reason:', hallucinationScore.info.reason)
            console.log('Score:', hallucinationScore.score)

            // Assert that the relevancy score is above a reasonable threshold
            expect(hallucinationScore.score).toBe(0);
        }, 30000);
    });
});