// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/policy-set.repository.ts
// NEW FILE
// ============================================================================

import { PolicySetAggregate }
from "../../domain/aggregates/policy-set.aggregate";

export interface PolicySetRepository{

    save(

        aggregate:PolicySetAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<PolicySetAggregate|null>;

}
