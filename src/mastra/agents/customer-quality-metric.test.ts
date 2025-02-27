import { describe, it, expect } from 'vitest';
import { openai } from '@ai-sdk/openai';
import { CustomerQualityMetric } from './customer-quality-metric';

const model = openai('gpt-4o');
const customerQualityMetric = new CustomerQualityMetric(model);

// Helper function to check if a score matches a rating range
const isScoreInRatingRange = (score: number, rating: 'Poor' | 'Good' | 'Excellent'): boolean => {
    const ranges = {
        'Poor': [0, 5],
        'Good': [5.1, 7.5],
        'Excellent': [7.6, 10]
    };
    return score >= ranges[rating][0] && score <= ranges[rating][1];
};

describe('Customer Quality Metric Tests', () => {
    const testCases = [
        {
            name: 'Technical Support Query - Should be Excellent',
            query: "My QuantumTech Q1000 keeps showing a blue error screen during initialization. What should I do?",
            response: "I understand how frustrating it can be when your Q1000 isn't working properly. The blue error screen typically indicates a calibration issue. Here are the steps to resolve it:\n\n1. Power down the system completely\n2. Wait 30 seconds\n3. Hold the reset button while powering on\n4. Release when you hear two beeps\n\nIf the issue persists, I can help you connect with our technical support team. Would you like me to do that?",
            expectedMinRatings: {
                empathy: 'Good',       // Shows understanding of frustration
                actionability: 'Excellent', // Clear step-by-step instructions
                clarity: 'Excellent'    // Well-structured response
            }
        },
        {
            name: 'Incomplete Response - Should be Poor',
            query: "What's the difference between the Q1000 and Q2000 models, and what are their pricing options?",
            response: "The Q2000 has more qubit capacity than the Q1000 and features improved error correction.",
            expectedMinRatings: {
                completeness: 'Poor',   // Missing pricing information
                clarity: 'Poor',        // Too brief and lacks structure
                actionability: 'Poor'   // No guidance on next steps
            }
        },
        {
            name: 'Empathetic Billing Response - Should be Good/Excellent',
            query: "I was charged twice for my last month's quantum cloud subscription. Can you help?",
            response: "I sincerely apologize for the duplicate charge - I completely understand your concern. I've verified your account and can confirm there was an error in our billing system. I've already initiated a refund for the extra charge, which should appear in 3-5 business days. As a gesture of goodwill, I'm adding a 10% credit to your next month's subscription. Please let me know if you don't see the refund by next week, and I'll follow up personally.",
            expectedMinRatings: {
                empathy: 'Excellent',    // Strong empathy and personal touch
                actionability: 'Good',   // Clear next steps and timeline
                clarity: 'Good'          // Clear explanation and resolution
            }
        }
    ];

    testCases.forEach(({ name, query, response, expectedMinRatings }) => {
        it(`should evaluate ${name}`, async () => {
            const result = await customerQualityMetric.measure(query, response);

            // Log detailed results for analysis
            console.log(`\nTest Case: ${name}`);
            console.log('Scores:', JSON.stringify(result.info.scores, null, 2));
            console.log('Recommendations:', result.info.recommendations);
            console.log('Reason:', result.info.reason);
            console.log('Overall Score:', result.score);

            // Check that scores align with expected minimum ratings
            Object.entries(expectedMinRatings).forEach(([dimension, expectedRating]) => {
                const score = result.info.scores[dimension as keyof typeof result.info.scores];
                const ratingRanges = {
                    'Poor': 2.5,
                    'Good': 7.5,
                    'Excellent': 10
                };
                expect(score,
                    `${dimension} score ${score} should meet minimum rating ${expectedRating}`
                ).toBeGreaterThanOrEqual(ratingRanges[expectedRating as keyof typeof ratingRanges] * 0.9);
            });

            // Verify score components and ranges
            Object.entries(result.info.scores).forEach(([dimension, score]) => {
                expect(score, `${dimension} score should be between 0 and 10`).toBeGreaterThanOrEqual(0);
                expect(score, `${dimension} score should be between 0 and 10`).toBeLessThanOrEqual(10);

                // Score should align with one of our rating ranges
                expect(
                    ['Poor', 'Good', 'Excellent'].some(rating =>
                        isScoreInRatingRange(score, rating as 'Poor' | 'Good' | 'Excellent')
                    ),
                    `${dimension} score ${score} should fall within a valid rating range`
                ).toBe(true);
            });

            // Should have recommendations
            expect(Array.isArray(result.info.recommendations)).toBe(true);

            // Recommendations should be relevant to scores
            if (Object.values(result.info.scores).some(score => score <= 7.5)) {
                expect(result.info.recommendations.length).toBeGreaterThan(0);
            }

            // Should have a detailed reason
            expect(typeof result.info.reason).toBe('string');
            expect(result.info.reason.length).toBeGreaterThan(50);
        }, 60000);
    });

    it('should respect custom weights with categorical scores', async () => {
        const customWeightMetric = new CustomerQualityMetric(model, {
            weights: {
                correctness: 0.5,    // Heavily weight correctness
                completeness: 0.2,
                clarity: 0.2,
                empathy: 0.05,       // Minimize emotional factors
                actionability: 0.05
            }
        });

        const result = await customWeightMetric.measure(
            testCases[0].query,
            testCases[0].response
        );

        // Log results for analysis
        console.log('\nCustom Weights Test');
        console.log('Scores:', JSON.stringify(result.info.scores, null, 2));
        console.log('Overall Score:', result.score);

        // Verify weights affect final score
        const standardResult = await customerQualityMetric.measure(
            testCases[0].query,
            testCases[0].response
        );

        // Scores should be different due to weight differences
        expect(result.score).not.toBe(standardResult.score);
    }, 60000);
});
