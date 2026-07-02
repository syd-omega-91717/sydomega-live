// ============================================================================
// FILE: /backend/src/modules/workflow/domain/entities/workflow-execution.ts
// NEW FILE
// ============================================================================

import { WorkflowExecutionId }
from "../value-objects/workflow-execution-id";

import { ExecutionState }
from "../enums/execution-state";

export class WorkflowExecution{

    constructor(

        readonly id:WorkflowExecutionId,

        readonly workflowId:string,

        readonly triggerId:string,

        readonly state:ExecutionState,

        readonly startedAt:Date,

        readonly completedAt:Date|null

    ){}

}
