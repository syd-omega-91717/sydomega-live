// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/entitlement.repository.ts
// NEW FILE
// ============================================================================

import { EntitlementAggregate }
from "../../domain/aggregates/entitlement.aggregate";

export interface EntitlementRepository{

    save(

        aggregate:EntitlementAggregate

    ):Promise<void>;

    find(

        entitlementId:string

    ):Promise<EntitlementAggregate|null>;

    active(

        principalId:string

    ):Promise<EntitlementAggregate[]>;

}
