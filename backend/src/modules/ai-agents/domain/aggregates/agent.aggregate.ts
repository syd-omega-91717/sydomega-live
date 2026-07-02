// ============================================================================
// FILE: /backend/src/modules/ai-agents/domain/aggregates/agent.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { AgentId }
from "../value-objects/agent-id";

export class AgentAggregate
extends AggregateRoot<AgentId>{

    register(){}

    assign(){}

    execute(){}

    delegate(){}

    complete(){}

}
