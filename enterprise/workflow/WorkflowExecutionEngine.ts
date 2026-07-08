// ============================================================================
// FILE:
// /enterprise/workflow/WorkflowExecutionEngine.ts
// ============================================================================

import { WorkflowInstance } from "./WorkflowInstance";

export class WorkflowExecutionEngine{

    execute(

        instance:WorkflowInstance

    ){

        instance.status="RUNNING";

        return instance;

    }

}
