// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/framework-mapping.ts
// NEW FILE
// ============================================================================

import { FrameworkMappingId }
from "../value-objects/framework-mapping-id";

import { MappingStatus }
from "../enums/mapping-status";

export class FrameworkMapping{

    constructor(

        readonly id:FrameworkMappingId,

        readonly sourceFramework:string,

        readonly sourceControl:string,

        readonly targetFramework:string,

        readonly targetControl:string,

        readonly confidence:number,

        readonly status:MappingStatus,

        readonly createdAt:Date

    ){}

}
