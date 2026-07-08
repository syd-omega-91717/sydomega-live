// ============================================================================
// FILE:
// /enterprise/ai/AgentRegistry.ts
// ============================================================================

import { EnterpriseAgent } from "./EnterpriseAgent";

export class AgentRegistry{

    private readonly agents=

    new Map<string,EnterpriseAgent>();

    register(

        agent:EnterpriseAgent

    ){

        this.agents.set(

            agent.id,

            agent

        );

    }

    find(

        id:string

    ){

        return this.agents.get(id);

    }

    list(){

        return [...this.agents.values()];

    }

}
