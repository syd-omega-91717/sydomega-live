// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/approval-workflow.repository.ts
// NEW FILE
// ============================================================================

import { ApprovalWorkflowAggregate }
from "../../domain/aggregates/approval-workflow.aggregate";

export interface ApprovalWorkflowRepository{

    save(

        aggregate:ApprovalWorkflowAggregate

    ):Promise<void>;

    find(

        workflowId:string

    ):Promise<ApprovalWorkflowAggregate|null>;

}
