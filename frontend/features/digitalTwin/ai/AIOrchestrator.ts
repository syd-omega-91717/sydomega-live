// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/AIOrchestrator.ts
// ============================================================================

import {AgentRegistry}

from "./agents/AgentRegistry";

export class AIOrchestrator{

    constructor(

        private readonly registry:

        AgentRegistry

    ){}

    async execute(

        input:unknown

    ){

        const results=[];

        for(

            const agent

            of this.registry.all()

        ){

            results.push(

                await agent.execute(

                    input

                )

            );

        }

        return results;

    }

}
