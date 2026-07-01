// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/approval-workflow.ts
// NEW FILE
// ============================================================================

import { ApprovalWorkflowId }
from "../value-objects/approval-workflow-id";

import { ApprovalStage }
from "./approval-stage";

export class ApprovalWorkflow{

    constructor(

        readonly id:ApprovalWorkflowId,

        readonly requestId:string,

        readonly stages:ApprovalStage[]

    ){}

}
