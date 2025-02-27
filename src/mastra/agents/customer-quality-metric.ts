import { Metric, type MetricResult } from '@mastra/core/eval';
import { type LanguageModel } from '@mastra/core/llm';

import { CustomerSupportQualityJudge } from './judge';

export interface CustomerQualityMetricOptions {
    scale?: number;
    weights?: {
        correctness?: number;
        completeness?: number;
        clarity?: number;
        empathy?: number;
        actionability?: number;
    };
}

export interface CustomerQualityMetricResultWithInfo extends MetricResult {
    info: {
        scores: {
            correctness: number;
            completeness: number;
            clarity: number;
            empathy: number;
            actionability: number;
        };
        recommendations: string[];
        reason: string;
    };
}

export class CustomerQualityMetric extends Metric {
    private judge: CustomerSupportQualityJudge;
    private scale: number;
    private weights: Required<NonNullable<CustomerQualityMetricOptions['weights']>>;

    constructor(
        model: LanguageModel,
        {
            scale = 1,
            weights = {
                correctness: 0.3,
                completeness: 0.2,
                clarity: 0.2,
                empathy: 0.15,
                actionability: 0.15,
            },
        }: CustomerQualityMetricOptions = {}
    ) {
        super();

        this.judge = new CustomerSupportQualityJudge(model);
        this.scale = scale;
        this.weights = weights as Required<NonNullable<CustomerQualityMetricOptions['weights']>>;
    }

    async measure(input: string, output: string): Promise<CustomerQualityMetricResultWithInfo> {
        const evaluation = await this.judge.evaluate(input, output);
        const score = this.calculateScore(evaluation.scores);
        const reason = await this.judge.getReason({
            input,
            output,
            scores: evaluation.scores,
            recommendations: evaluation.recommendations,
            overallScore: evaluation.overallScore,
        });

        return {
            score: score * this.scale,
            info: {
                scores: evaluation.scores,
                recommendations: evaluation.recommendations,
                reason,
            },
        };
    }

    private calculateScore(scores: CustomerQualityMetricResultWithInfo['info']['scores']): number {
        // Calculate weighted average of scores (converting from 0-10 to 0-1 scale)
        return (
            (scores.correctness * this.weights.correctness +
                scores.completeness * this.weights.completeness +
                scores.clarity * this.weights.clarity +
                scores.empathy * this.weights.empathy +
                scores.actionability * this.weights.actionability) / 10
        );
    }
}