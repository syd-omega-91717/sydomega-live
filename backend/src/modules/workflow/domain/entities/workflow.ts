// ============================================================================
// FILE: /backend/src/modules/workflow/domain/entities/workflow.ts
// NEW FILE
// ============================================================================

import { WorkflowId }
from "../value-objects/workflow-id";

import { WorkflowStatus }
from "../enums/workflow-status";

export class Workflow{

    constructor(

        readonly id:WorkflowId,

        readonly tenantId:string,

        readonly name:string,

        readonly version:string,

        readonly status:WorkflowStatus,

        readonly createdAt:Date

    ){}

}
