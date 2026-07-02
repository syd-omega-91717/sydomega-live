// ============================================================================
// FILE: /backend/src/modules/ai-agents/infrastructure/repositories/agent.repository.ts
// NEW FILE
// ============================================================================

import { AgentAggregate }
from "../../domain/aggregates/agent.aggregate";

export interface AgentRepository{

    save(

        aggregate:AgentAggregate

    ):Promise<void>;

    active(

    ):Promise<AgentAggregate[]>;

}
