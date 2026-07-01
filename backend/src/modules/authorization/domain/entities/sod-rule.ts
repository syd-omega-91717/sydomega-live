// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/sod-rule.ts
// NEW FILE
// ============================================================================

import { SodSeverity }
from "../enums/sod-severity";

export class SodRule{

    constructor(

        readonly id:string,

        readonly leftRoleId:string,

        readonly rightRoleId:string,

        readonly severity:SodSeverity,

        readonly description:string

    ){}

}
