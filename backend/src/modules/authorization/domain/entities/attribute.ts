// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/attribute.ts
// NEW FILE
// ============================================================================

import { AttributeId }
from "../value-objects/attribute-id";

import { AttributeSource }
from "../enums/attribute-source";

export class Attribute{

    constructor(

        readonly id:AttributeId,

        readonly name:string,

        readonly source:AttributeSource,

        readonly type:string,

        readonly required:boolean

    ){}

}
