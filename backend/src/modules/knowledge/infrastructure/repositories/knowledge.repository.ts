// ============================================================================
// FILE: /backend/src/modules/knowledge/infrastructure/repositories/knowledge.repository.ts
// NEW FILE
// ============================================================================

import { KnowledgeAggregate }
from "../../domain/aggregates/knowledge.aggregate";

export interface KnowledgeRepository{

    save(

        aggregate:KnowledgeAggregate

    ):Promise<void>;

    find(

        entityId:string

    ):Promise<KnowledgeAggregate|null>;

}
