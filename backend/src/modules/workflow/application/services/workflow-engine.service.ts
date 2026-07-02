// ============================================================================
// FILE: /backend/src/modules/workflow/application/services/workflow-engine.service.ts
// NEW FILE
// ============================================================================

import { WorkflowExecution }
from "../../domain/entities/workflow-execution";

export interface WorkflowEngineService{

    start(

        workflowId:string

    ):Promise<WorkflowExecution>;

    resume(

        executionId:string

    ):Promise<void>;

    cancel(

        executionId:string

    ):Promise<void>;

}
