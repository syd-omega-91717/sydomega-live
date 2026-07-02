// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/compliance-control.ts
// NEW FILE
// ============================================================================

import { ComplianceControlId }
from "../value-objects/compliance-control-id";

import { ControlStatus }
from "../enums/control-status";

import { ComplianceFramework }
from "../enums/compliance-framework";

export class ComplianceControl{

    constructor(

        readonly id:ComplianceControlId,

        readonly controlId:string,

        readonly framework:ComplianceFramework,

        readonly title:string,

        readonly description:string,

        readonly owner:string,

        readonly status:ControlStatus,

        readonly reviewDate:Date

    ){}

}
