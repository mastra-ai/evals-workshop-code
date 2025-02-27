import { Agent } from "@mastra/core/agent"
import { openai } from '@ai-sdk/openai'
import { HallucinationMetric } from "@mastra/evals/llm";

const model = openai('gpt-4o')

// Sample context about a fictional company
const companyContext = [
    "QuantumTech was founded in 2015 by Dr. Amelia Chen and Dr. Marcus Rodriguez in Toronto, Canada.",
    "The company specializes in quantum computing hardware, particularly quantum processing units (QPUs).",
    "QuantumTech released its first commercial quantum computer with 128 qubits in 2020.",
    "The company has secured $340 million in venture capital funding as of December 2023.",
    "QuantumTech employs approximately 450 people across offices in Toronto, Palo Alto, and Zurich."
];

const initial_prompt = `
  You are a helpful assistant that provides information about QuantumTech, a quantum computing company.
  Be detailed and informative in your responses.
`

export const hallucinationMetric = new HallucinationMetric(model, {
    scale: 1,
    context: companyContext,
});

export const hallucinationAgent = new Agent({
    instructions: initial_prompt,
    name: "Hallucination Agent",
    model: model,
})
