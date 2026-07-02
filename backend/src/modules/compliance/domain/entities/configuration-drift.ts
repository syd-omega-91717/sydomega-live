// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/configuration-drift.ts
// NEW FILE
// ============================================================================

import { DriftType }
from "../enums/drift-type";

export class ConfigurationDrift{

    constructor(

        readonly driftId:string,

        readonly resourceId:string,

        readonly type:DriftType,

        readonly expectedState:string,

        readonly actualState:string,

        readonly detectedAt:Date

    ){}

}
