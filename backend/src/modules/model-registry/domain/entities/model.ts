// ============================================================================
// FILE: /backend/src/modules/model-registry/domain/entities/model.ts
// NEW FILE
// ============================================================================

import { ModelId }
from "../value-objects/model-id";

import { ModelStatus }
from "../enums/model-status";

export class Model{

    constructor(

        readonly id:ModelId,

        readonly name:string,

        readonly provider:string,

        readonly version:string,

        readonly status:ModelStatus,

        readonly checksum:string,

        readonly createdAt:Date

    ){}

}
