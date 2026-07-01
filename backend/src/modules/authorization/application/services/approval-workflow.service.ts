// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/approval-workflow.service.ts
// NEW FILE
// ============================================================================

import { ApprovalWorkflow }
from "../../domain/entities/approval-workflow";

export interface ApprovalWorkflowService{

    active():Promise<ApprovalWorkflow[]>;

    find(

        workflowId:string

    ):Promise<ApprovalWorkflow|null>;

}
