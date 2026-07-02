// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/remediation-playbook.ts
// NEW FILE
// ============================================================================

import { RemediationId }
from "../value-objects/remediation-id";

import { PlaybookType }
from "../enums/playbook-type";

import { RemediationStatus }
from "../enums/remediation-status";

export class RemediationPlaybook{

    constructor(

        readonly id:RemediationId,

        readonly playbookId:string,

        readonly name:string,

        readonly type:PlaybookType,

        readonly version:string,

        readonly automatic:boolean,

        readonly status:RemediationStatus,

        readonly createdAt:Date

    ){}

}
