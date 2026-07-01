// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/approval-workflow.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ApprovalWorkflowId }
from "../value-objects/approval-workflow-id";

export class ApprovalWorkflowAggregate
extends AggregateRoot<ApprovalWorkflowId>{

    start(){}

    approveStage(){}

    rejectStage(){}

    nextStage(){}

    complete(){}

}
