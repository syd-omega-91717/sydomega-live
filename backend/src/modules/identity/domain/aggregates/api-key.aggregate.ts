// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/api-key.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot } from "@/kernel/domain/aggregate-root";
import { ApiKeyId } from "../value-objects/api-key-id";

export class ApiKeyAggregate
extends AggregateRoot<ApiKeyId>{

    create(){}

    rotate(){}

    revoke(){}

    expire(){}

}
