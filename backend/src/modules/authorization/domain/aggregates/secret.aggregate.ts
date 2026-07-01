// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/secret.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { SecretId }
from "../value-objects/secret-id";

export class SecretAggregate
extends AggregateRoot<SecretId>{

    create(){}

    checkout(){}

    return(){}

    rotate(){}

    revoke(){}

}
