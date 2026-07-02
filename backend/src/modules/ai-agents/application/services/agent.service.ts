// ============================================================================
// FILE: /backend/src/modules/ai-agents/application/services/agent.service.ts
// NEW FILE
// ============================================================================

import { AgentResult }
from "../../domain/entities/agent-result";

export interface AgentService{

    assign(

        objective:string

    ):Promise<AgentResult>;

    collaborate(

        agents:string[]

    ):Promise<void>;

}
