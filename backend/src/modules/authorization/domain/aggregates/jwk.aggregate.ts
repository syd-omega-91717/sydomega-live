// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/jwk.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { JwkKeyId }
from "../value-objects/jwk-key-id";

export class JwkAggregate
extends AggregateRoot<JwkKeyId>{

    generate(){}

    publish(){}

    rotate(){}

    retire(){}

    revoke(){}

}
