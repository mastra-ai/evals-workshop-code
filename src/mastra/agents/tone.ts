import { Agent } from "@mastra/core/agent"
import { openai } from '@ai-sdk/openai'
import { ToneConsistencyMetric } from "@mastra/evals/nlp";

const model = openai('gpt-4o')

const instructions = `
  You are a assistant that provides information about QuantumTech, a quantum computing company.
  Be detailed and informative in your responses.
`

export const toneConsistencyMetric = new ToneConsistencyMetric();

export const toneConsistencyAgent = new Agent({
  instructions,
  name: "Tone Consistency Agent",
  model: model,
})
