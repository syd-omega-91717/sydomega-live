// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/policy.repository.ts
// NEW FILE
// ============================================================================

import { PolicyAggregate }
from "../../domain/aggregates/policy.aggregate";

export interface PolicyRepository{

    save(

        aggregate:PolicyAggregate

    ):Promise<void>;

    findById(

        id:string

    ):Promise<PolicyAggregate|null>;

    findByResource(

        resource:string

    ):Promise<PolicyAggregate[]>;

}
