// ============================================================================
// FILE: /backend/src/modules/ai-agents/domain/entities/agent.ts
// NEW FILE
// ============================================================================

import { AgentId }
from "../value-objects/agent-id";

import { AgentRole }
from "../enums/agent-role";

import { AgentStatus }
from "../enums/agent-status";

export class Agent{

    constructor(

        readonly id:AgentId,

        readonly name:string,

        readonly role:AgentRole,

        readonly model:string,

        readonly status:AgentStatus,

        readonly tools:string[],

        readonly memoryId:string

    ){}

}
