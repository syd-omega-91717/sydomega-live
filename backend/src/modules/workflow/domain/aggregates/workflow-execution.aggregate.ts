// ============================================================================
// FILE: /backend/src/modules/workflow/domain/aggregates/workflow-execution.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { WorkflowExecutionId }
from "../value-objects/workflow-execution-id";

export class WorkflowExecutionAggregate
extends AggregateRoot<WorkflowExecutionId>{

    initialize(){}

    execute(){}

    checkpoint(){}

    recover(){}

    terminate(){}

}
