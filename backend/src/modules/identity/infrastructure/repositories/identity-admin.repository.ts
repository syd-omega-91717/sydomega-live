// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/identity-admin.repository.ts
// NEW FILE
// ============================================================================

import { IdentityAdminAggregate }
from "../../domain/aggregates/identity-admin.aggregate";

export interface IdentityAdminRepository{

    save(

        aggregate:IdentityAdminAggregate

    ):Promise<void>;

    find(

        administratorId:string

    ):Promise<IdentityAdminAggregate|null>;

}
