import { openai } from "@ai-sdk/openai"
import { Agent } from "@mastra/core/agent"
import { CustomerQualityMetric } from "./customer-quality-metric";
import { AnswerRelevancyMetric, HallucinationMetric } from "@mastra/evals/llm";
import { ToneConsistencyMetric } from "@mastra/evals/nlp";

const model = openai('gpt-4o')

const initial_prompt = `
  You are a helpful assistant that provides information about QuantumTech, a quantum computing company.
  Be detailed and informative in your responses.
`

const customerSupportQualityMetric = new CustomerQualityMetric(model)

const companyContext = [
    "QuantumTech was founded in 2015 by Dr. Amelia Chen and Dr. Marcus Rodriguez in Toronto, Canada.",
    "The company specializes in quantum computing hardware, particularly quantum processing units (QPUs).",
    "QuantumTech released its first commercial quantum computer with 128 qubits in 2020.",
    "The company has secured $340 million in venture capital funding as of December 2023.",
    "QuantumTech employs approximately 450 people across offices in Toronto, Palo Alto, and Zurich."
];

const hallucinationMetric = new HallucinationMetric(model, {
    scale: 1,
    context: companyContext,
});

const answerRelevancyMetric = new AnswerRelevancyMetric(model, {
    uncertaintyWeight: 0.5,
    scale: 1,
});

const toneConsistencyMetric = new ToneConsistencyMetric();

export const customerSupportAgent = new Agent({
    instructions: initial_prompt,
    name: "QuantumTech Customer Support Agent",
    model: openai('gpt-4o'),
    evals: {
        customerSupportQualityMetric,
        hallucinationMetric,
        toneConsistencyMetric,
        answerRelevancyMetric,
    }
})
