// ============================================================================
// FILE: /backend/src/modules/memory/application/services/memory.service.ts
// NEW FILE
// ============================================================================

import { MemoryContext }
from "../../domain/entities/memory-context";

export interface MemoryService{

    store(

        content:string

    ):Promise<void>;

    retrieve(

        query:string

    ):Promise<MemoryContext>;

    consolidate(

    ):Promise<void>;

}
