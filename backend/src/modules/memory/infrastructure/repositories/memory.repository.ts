// ============================================================================
// FILE: /backend/src/modules/memory/infrastructure/repositories/memory.repository.ts
// NEW FILE
// ============================================================================

import { MemoryAggregate }
from "../../domain/aggregates/memory.aggregate";

export interface MemoryRepository{

    save(

        aggregate:MemoryAggregate

    ):Promise<void>;

    find(

        memoryId:string

    ):Promise<MemoryAggregate|null>;

}
