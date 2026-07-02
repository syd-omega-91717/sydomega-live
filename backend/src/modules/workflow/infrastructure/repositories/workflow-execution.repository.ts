// ============================================================================
// FILE: /backend/src/modules/workflow/infrastructure/repositories/workflow-execution.repository.ts
// NEW FILE
// ============================================================================

import { WorkflowExecutionAggregate }
from "../../domain/aggregates/workflow-execution.aggregate";

export interface WorkflowExecutionRepository{

    save(

        aggregate:WorkflowExecutionAggregate

    ):Promise<void>;

    find(

        executionId:string

    ):Promise<WorkflowExecutionAggregate|null>;

}
