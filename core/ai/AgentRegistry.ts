// ============================================================================
// FILE:
// /core/ai/AgentRegistry.ts
// ============================================================================

import { AIAgent } from "./AIAgent";

export class AgentRegistry{

    private readonly agents=

    new Map<string,AIAgent>();

    register(

        agent:AIAgent

    ){

        this.agents.set(

            agent.code,

            agent

        );

    }

    get(

        code:string

    ){

        return this.agents.get(code);

    }

    all(){

        return[

            ...this.agents.values()

        ];

    }

}
