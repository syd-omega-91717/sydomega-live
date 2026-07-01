// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/sod-violation.ts
// NEW FILE
// ============================================================================

import { SodSeverity }
from "../enums/sod-severity";

export class SodViolation{

    constructor(

        readonly userId:string,

        readonly ruleId:string,

        readonly severity:SodSeverity,

        readonly detectedAt:Date

    ){}

}
