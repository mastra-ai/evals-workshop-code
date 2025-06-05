
import { Mastra } from '@mastra/core';
import { customerSupportAgent } from './agents/customer-support';
import { LibSQLStore } from '@mastra/libsql';

const storage = new LibSQLStore({
    url: ':memory:',
})

export const mastra = new Mastra({
    agents: {
        customerSupportAgent,
    },
    storage,
})
