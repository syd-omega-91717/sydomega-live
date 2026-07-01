// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/approval-stage.ts
// NEW FILE
// ============================================================================

import { ApprovalStageStatus }
from "../enums/approval-stage-status";

export class ApprovalStage{

    constructor(

        readonly order:number,

        readonly approverRole:string,

        readonly approverId:string|null,

        readonly status:ApprovalStageStatus,

        readonly approvedAt:Date|null

    ){}

}
