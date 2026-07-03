// ============================================================================
// FILE: /backend/src/modules/object-storage/infrastructure/repositories/storage.repository.ts
// NEW FILE
// ============================================================================

import { StorageAggregate }
from "../../domain/aggregates/storage.aggregate";

export interface StorageRepository{

    save(

        aggregate:StorageAggregate

    ):Promise<void>;

}
