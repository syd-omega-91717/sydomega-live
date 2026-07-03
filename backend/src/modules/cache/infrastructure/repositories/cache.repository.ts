// ============================================================================
// FILE: /backend/src/modules/cache/infrastructure/repositories/cache.repository.ts
// NEW FILE
// ============================================================================

import { CacheAggregate }
from "../../domain/aggregates/cache.aggregate";

export interface CacheRepository{

    save(

        aggregate:CacheAggregate

    ):Promise<void>;

}
