// ============================================================================
// FILE:
// /enterprise/knowledge/KnowledgeRepository.ts
// ============================================================================

import { KnowledgeEntity } from "./KnowledgeEntity";

export class KnowledgeRepository{

    private repository=

    new Map<string,KnowledgeEntity>();

    save(

        entity:KnowledgeEntity

    ){

        this.repository.set(

            entity.id,

            entity

        );

    }

    find(

        id:string

    ){

        return this.repository.get(id);

    }

}
