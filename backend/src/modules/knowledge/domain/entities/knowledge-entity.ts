// ============================================================================
// FILE: /backend/src/modules/knowledge/domain/entities/knowledge-entity.ts
// NEW FILE
// ============================================================================

import { EntityId }
from "../value-objects/entity-id";

import { EntityType }
from "../enums/entity-type";

export class KnowledgeEntity{

    constructor(

        readonly id:EntityId,

        readonly tenantId:string,

        readonly type:EntityType,

        readonly label:string,

        readonly properties:Record<string,unknown>,

        readonly version:number

    ){}

}
