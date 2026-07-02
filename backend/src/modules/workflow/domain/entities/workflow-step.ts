// ============================================================================
// FILE: /backend/src/modules/workflow/domain/entities/workflow-step.ts
// NEW FILE
// ============================================================================

import { WorkflowStepType }
from "../enums/workflow-step-type";

export class WorkflowStep{

    constructor(

        readonly stepId:string,

        readonly workflowId:string,

        readonly type:WorkflowStepType,

        readonly order:number,

        readonly configuration:Record<string,unknown>

    ){}

}
