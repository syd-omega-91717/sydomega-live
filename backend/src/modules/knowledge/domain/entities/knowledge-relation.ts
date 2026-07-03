// ============================================================================
// FILE: /backend/src/modules/knowledge/domain/entities/knowledge-relation.ts
// NEW FILE
// ============================================================================

import { RelationType }
from "../enums/relation-type";

export class KnowledgeRelation{

    constructor(

        readonly relationId:string,

        readonly sourceId:string,

        readonly targetId:string,

        readonly relationType:RelationType,

        readonly confidence:number

    ){}

}
