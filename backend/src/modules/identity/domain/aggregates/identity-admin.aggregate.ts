// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/identity-admin.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { IdentityAdminId }
from "../value-objects/identity-admin-id";

export class IdentityAdminAggregate
extends AggregateRoot<IdentityAdminId>{

    lockUser(){}

    unlockUser(){}

    suspendUser(){}

    activateUser(){}

    disableUser(){}

    revokeSessions(){}

    resetPassword(){}

    resetMfa(){}

}
