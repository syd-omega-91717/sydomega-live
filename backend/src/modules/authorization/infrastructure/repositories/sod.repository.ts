// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/sod.repository.ts
// NEW FILE
// ============================================================================

import { SodAggregate }
from "../../domain/aggregates/sod.aggregate";

export interface SodRepository{

    save(

        aggregate:SodAggregate

    ):Promise<void>;

    find(

        policyId:string

    ):Promise<SodAggregate|null>;

    enabled(

    ):Promise<SodAggregate[]>;

}
