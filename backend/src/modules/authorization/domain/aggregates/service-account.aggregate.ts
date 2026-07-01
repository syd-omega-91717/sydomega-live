// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/service-account.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ServiceAccountId }
from "../value-objects/service-account-id";

export class ServiceAccountAggregate
extends AggregateRoot<ServiceAccountId>{

    create(){}

    rotateSecret(){}

    disable(){}

    revoke(){}

    assignRole(){}

}
