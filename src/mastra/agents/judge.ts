import { type LanguageModel } from '@mastra/core/llm';
import { MastraAgentJudge } from '@mastra/evals/judge';
import { z } from 'zod';

/**
 * Instructions for the CustomerSupportQualityJudge
 * These instructions guide the LLM judge on how to evaluate customer support responses
 */
const CUSTOMER_SUPPORT_QUALITY_INSTRUCTIONS = `
You are an expert evaluator of customer support responses. Your task is to analyze support agent responses
and evaluate them on several key dimensions of quality.

For each response, you should evaluate these dimensions using the following ratings (Poor, Good, or Excellent):

1. Correctness: Does the response provide factually correct information?
   - Poor: Contains significant factual errors
   - Good: Generally accurate information
   - Excellent: Completely accurate and well-supported information

   Examples:
   Poor: "Your warranty is valid for 5 years" (when it's actually 2 years)
   Good: "Your device comes with a 2-year warranty"
   Excellent: "Your device is covered by our 2-year manufacturer warranty, which includes parts and labor as detailed in section 3.1 of your warranty card"

2. Completeness: Does the response fully address all aspects of the customer's question?
   - Poor: Misses major parts of the question
   - Good: Covers most aspects thoroughly
   - Excellent: Comprehensively addresses all aspects

   Examples:
   Poor: "Yes, we can help" (when customer asked about pricing, timing, and process)
   Good: "The repair will cost $100 and take about 3 days"
   Excellent: "The repair costs $100, takes 2-3 business days, and includes diagnostic, parts, and labor. We'll provide daily updates and you can track progress online"

3. Clarity: Is the response clear, well-structured, and easily understood?
   - Poor: Confusing or poorly structured
   - Good: Clear and well-organized
   - Excellent: Exceptionally clear and well-structured

   Examples:
   Poor: "Well you see the thing is that like when the system goes into that mode it might need a reboot or maybe not"
   Good: "To fix this issue, restart your device and check if the error persists"
   Excellent: "Follow these steps to resolve the issue:\n1. Save your work\n2. Shut down your device\n3. Wait 30 seconds\n4. Restart and check if the error is gone"

4. Empathy: Does the response show understanding and appropriate empathy?
   - Poor: No empathy or understanding shown
   - Good: Shows genuine understanding and care
   - Excellent: Outstanding emotional intelligence and support

   Examples:
   Poor: "That's not our problem. Read the manual"
   Good: "I understand your frustration with this issue. Let me help you resolve it"
   Excellent: "I completely understand how frustrating it must be to lose your work due to this error. I've experienced this myself, and I'll make this my top priority to help you recover your data and prevent this from happening again"

5. Actionability: Does the response provide clear next steps or solutions?
   - Poor: No clear actions or next steps
   - Good: Clear, actionable steps
   - Excellent: Comprehensive, detailed guidance with alternatives

   Examples:
   Poor: "Try fixing it yourself"
   Good: "Click the 'Reset' button in Settings and restart your device"
   Excellent: "You have two options:\n1. Quick fix: Click 'Reset' in Settings and restart (takes 2 minutes)\n2. Full recovery: Follow our step-by-step guide at support.com/recovery (takes 10 minutes but recovers all data)\nI recommend option 1 first, and if the issue persists, we can try option 2. Would you like me to walk you through either option?"

Your evaluation must be fair, consistent, and based solely on the content of the response.
Provide specific examples from the response to justify each rating.
`;

export class CustomerSupportQualityJudge extends MastraAgentJudge {
    constructor(model: LanguageModel) {
        super('Customer Support Quality', CUSTOMER_SUPPORT_QUALITY_INSTRUCTIONS, model);
    }
    /**
     * Evaluates a customer support response based on multiple quality criteria
     */
    async evaluate(
        customerQuery: string,
        agentResponse: string,
    ): Promise<{
        scores: {
            correctness: number;
            completeness: number;
            clarity: number;
            empathy: number;
            actionability: number;
        };
        recommendations: string[];
        overallScore: number;
    }> {

        const qualityEvalPrompt = `
            Please evaluate the following customer support response:
            
            Customer Query:
            "${customerQuery}"
            
            Agent Response:
            "${agentResponse}"

            
            
            Evaluate each dimension using ONLY these ratings: Poor, Good, or Excellent.
            Format your response exactly as follows:

            {
                "ratings": {
                    "correctness": "Poor|Good|Excellent",
                    "completeness": "Poor|Good|Excellent",
                    "clarity": "Poor|Good|Excellent",
                    "empathy": "Poor|Good|Excellent",
                    "actionability": "Poor|Good|Excellent"
                },
                "examples": {
                    "correctness": "Specific example from response...",
                    "completeness": "Specific example from response...",
                    "clarity": "Specific example from response...",
                    "empathy": "Specific example from response...",
                    "actionability": "Specific example from response..."
                },
                "recommendations": [
                    "Specific recommendation 1",
                    "Specific recommendation 2"
                ]
            }

            Ensure your response is valid JSON and uses EXACTLY these rating values.
        `

        const result = await this.agent.generate(qualityEvalPrompt, {
            output: z.object({
                ratings: z.object({
                    correctness: z.enum(['Poor', 'Good', 'Excellent']),
                    completeness: z.enum(['Poor', 'Good', 'Excellent']),
                    clarity: z.enum(['Poor', 'Good', 'Excellent']),
                    empathy: z.enum(['Poor', 'Good', 'Excellent']),
                    actionability: z.enum(['Poor', 'Good', 'Excellent'])
                }),
                examples: z.object({
                    correctness: z.string(),
                    completeness: z.string(),
                    clarity: z.string(),
                    empathy: z.string(),
                    actionability: z.string()
                }),
                recommendations: z.array(z.string())
            }),
        });

        // Convert ratings to scores
        const scores = this.convertRatingsToScores(result.object.ratings);

        return {
            scores,
            recommendations: result.object.recommendations,
            overallScore: this.calculateOverallScore(scores)
        };
    }

    private convertRatingsToScores(ratings: Record<string, 'Poor' | 'Good' | 'Excellent'>): Record<string, number> {
        const ratingScores = {
            'Poor': 2.5,
            'Good': 7.5,
            'Excellent': 10
        };

        return Object.entries(ratings).reduce((acc, [key, rating]) => ({
            ...acc,
            [key]: ratingScores[rating]
        }), {}) as Record<string, number>;
    }

    private calculateOverallScore(scores: Record<string, number>): number {
        return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;
    }

    async getReason({
        input,
        output,
        scores,
        recommendations,
        overallScore,
    }: {
        input: string;
        output: string;
        scores: {
            correctness: number;
            completeness: number;
            clarity: number;
            empathy: number;
            actionability: number;
        };
        recommendations: string[];
        overallScore: number;
    }) {
        const prompt = `
            Please explain your reasoning for the following evaluation:
            
            Customer Query:
            "${input}"

            Agent Response:
            "${output}"

            Your Evaluation:
            - Correctness: ${this.convertScoreToRating(scores.correctness)}
              Score: ${scores.correctness}/10
              Examples from response that justify this rating:
              [Provide specific quotes or examples]

            - Completeness: ${this.convertScoreToRating(scores.completeness)}
              Score: ${scores.completeness}/10
              Examples from response that justify this rating:
              [Provide specific quotes or examples]

            - Clarity: ${this.convertScoreToRating(scores.clarity)}
              Score: ${scores.clarity}/10
              Examples from response that justify this rating:
              [Provide specific quotes or examples]

            - Empathy: ${this.convertScoreToRating(scores.empathy)}
              Score: ${scores.empathy}/10
              Examples from response that justify this rating:
              [Provide specific quotes or examples]

            - Actionability: ${this.convertScoreToRating(scores.actionability)}
              Score: ${scores.actionability}/10
              Examples from response that justify this rating:
              [Provide specific quotes or examples]

            Overall Score: ${overallScore}/10

            Improvement Recommendations:
            ${recommendations.map(rec => `- ${rec}`).join('\n')}

            For each dimension:
            1. Explain why the response earned its rating (Poor, Good, or Excellent)
            2. Quote specific parts of the response that demonstrate this rating
            3. If not Excellent, explain what would be needed to achieve a higher rating

            Format your response as valid JSON with this structure:
            {
                "reasoning": {
                    "correctness": { "rating": "...", "examples": ["..."], "improvement": "..." },
                    "completeness": { "rating": "...", "examples": ["..."], "improvement": "..." },
                    "clarity": { "rating": "...", "examples": ["..."], "improvement": "..." },
                    "empathy": { "rating": "...", "examples": ["..."], "improvement": "..." },
                    "actionability": { "rating": "...", "examples": ["..."], "improvement": "..." }
                },
                "overallAnalysis": "..."
            }
        `

        const result = await this.agent.generate(prompt, {
            output: z.object({
                reasoning: z.object({
                    correctness: z.object({
                        rating: z.enum(['Poor', 'Good', 'Excellent']),
                        examples: z.array(z.string()),
                        improvement: z.string()
                    }),
                    completeness: z.object({
                        rating: z.enum(['Poor', 'Good', 'Excellent']),
                        examples: z.array(z.string()),
                        improvement: z.string()
                    }),
                    clarity: z.object({
                        rating: z.enum(['Poor', 'Good', 'Excellent']),
                        examples: z.array(z.string()),
                        improvement: z.string()
                    }),
                    empathy: z.object({
                        rating: z.enum(['Poor', 'Good', 'Excellent']),
                        examples: z.array(z.string()),
                        improvement: z.string()
                    }),
                    actionability: z.object({
                        rating: z.enum(['Poor', 'Good', 'Excellent']),
                        examples: z.array(z.string()),
                        improvement: z.string()
                    })
                }),
                overallAnalysis: z.string()
            }),
        });

        // Format the reasoning into a readable string
        const formatReasoning = (dimension: string, r: { rating: string, examples: string[], improvement: string }) => `
${dimension}:
Rating: ${r.rating}
Examples: ${r.examples.map(e => `\n- "${e}"`).join('')}
${r.improvement ? `\nTo improve: ${r.improvement}` : ''}`;

        const reasoning = Object.entries(result.object.reasoning)
            .map(([dim, r]) => formatReasoning(dim, r))
            .join('\n\n');

        return `${reasoning}\n\nOverall Analysis:\n${result.object.overallAnalysis}`;
    }

    private convertScoreToRating(score: number): string {
        if (score < 5) {
            return 'Poor';
        } else if (score < 8) {
            return 'Good';
        } else {
            return 'Excellent';
        }
    }
}