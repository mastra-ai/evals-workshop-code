
import { Mastra } from '@mastra/core';
import { customerSupportAgent } from './agents/customer-support';

export const mastra = new Mastra({
    agents: {
        customerSupportAgent,
    }
})
