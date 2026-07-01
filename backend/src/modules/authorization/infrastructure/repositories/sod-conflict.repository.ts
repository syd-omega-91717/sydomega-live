// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/sod-conflict.repository.ts
// NEW FILE
// ============================================================================

import { SodConflictAggregate }
from "../../domain/aggregates/sod-conflict.aggregate";

export interface SodConflictRepository{

    save(

        aggregate:SodConflictAggregate

    ):Promise<void>;

    find(

        conflictId:string

    ):Promise<SodConflictAggregate|null>;

    open(

    ):Promise<SodConflictAggregate[]>;

}
