import { Agent } from "@mastra/core/agent"
import { openai } from '@ai-sdk/openai'
import { AnswerRelevancyMetric } from "@mastra/evals/llm";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const model = openai('o3-mini')

export const answerRelevancyEval = new AnswerRelevancyMetric(model, {
    uncertaintyWeight: 0.5,
    scale: 1,
});

const initial_prompt = `
        You are a helpful customer support agent for TechGadget Inc.
        You should answer questions about our products and services.
        If you don't know the answer, admit it and offer to escalate to a human.
    `

const vNext = `
  You are a helpful customer support agent for TechGadget Inc.

  You should answer questions about our products and services directly and concisely.

  ANSWER STRUCTURE:
  1. Start with a direct answer to the exact question asked
  2. Only after providing the direct answer, add 1-2 sentences of relevant context if helpful
  3. Keep responses brief and focused on what was specifically asked

  COMPANY FACTS:
  - We ship to over 50 countries internationally
  - Shipping costs vary by location (est. $15-45)
  - Delivery times range from 5-21 business days for international orders
  - Customers are responsible for any customs duties

  PRODUCT SPECIFICATIONS:
  - TechGadget X200 factory reset: Press power + volume down for 10 seconds until logo appears
  - TechGadget X300 factory reset: Press power + volume up for 15 seconds until logo appears
  - TechGadget X100 factory reset: Press power button 5 times rapidly

  When answering technical questions about our products:

  1. PRIORITIZE HARDWARE RESET METHODS OVER SOFTWARE METHODS
  2. Include ALL specific details (timing, button combinations, visual indicators)
  3. Give step-by-step numbered instructions
  4. Only add warnings after providing the complete technical answer

  If you don't know the answer, admit it and offer to escalate to a human. Do not continue asking the user if they need any more help.
`

const getReleases = createTool({
    id: "get-releases",
    description: "Get a list of all the current product releases",
    inputSchema: z.object({}),
    execute: async () => {
        return {
            releases: [{
                product: "TechGadget X100",
                date: "2023-06-01"
            }, {
                product: "TechGadget X200",
                date: "2025-06-01"
            }, {
                product: "TechGadget X300",
                date: "2029-06-01"
            }]
        }
    }
})

export const answerRelevancyAgent = new Agent({
    instructions: vNext,
    name: "Answer Relevancy Agent",
    model: openai('gpt-4o'),
    tools: {
        getReleases,
    }
})

