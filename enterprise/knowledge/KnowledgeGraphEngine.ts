// ============================================================================
// FILE:
// /enterprise/knowledge/KnowledgeGraphEngine.ts
// ============================================================================

import { KnowledgeEntity } from "./KnowledgeEntity";
import { KnowledgeRelationship } from "./KnowledgeRelationship";

export class KnowledgeGraphEngine{

    private entities=

    new Map<string,KnowledgeEntity>();

    private relations:KnowledgeRelationship[]=[];

    registerEntity(

        entity:KnowledgeEntity

    ){

        this.entities.set(

            entity.id,

            entity

        );

    }

    registerRelationship(

        relation:KnowledgeRelationship

    ){

        this.relations.push(

            relation

        );

    }

}
