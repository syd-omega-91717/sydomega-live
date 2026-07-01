// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/sod-conflict.ts
// NEW FILE
// ============================================================================

import { SodConflictId }
from "../value-objects/sod-conflict-id";

import { SodSeverity }
from "../enums/sod-severity";

import { ConflictResolutionStatus }
from "../enums/conflict-resolution-status";

export class SodConflict{

    constructor(

        readonly id:SodConflictId,

        readonly userId:string,

        readonly leftRoleId:string,

        readonly rightRoleId:string,

        readonly severity:SodSeverity,

        readonly status:ConflictResolutionStatus,

        readonly detectedAt:Date

    ){}

}
