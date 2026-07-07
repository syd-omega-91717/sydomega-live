// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/agents/AgentRegistry.ts
// ============================================================================

import {DigitalTwinAgent}

from "./DigitalTwinAgent";

export class AgentRegistry{

    private readonly agents=

    new Map<string,DigitalTwinAgent>();

    register(agent:DigitalTwinAgent){

        this.agents.set(

            agent.id,

            agent

        );

    }

    get(id:string){

        return this.agents.get(id);

    }

    all(){

        return [...this.agents.values()];

    }

    unregister(id:string){

        this.agents.delete(id);

    }

}
