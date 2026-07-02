// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/token-exchange.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { TokenExchangeId }
from "../value-objects/token-exchange-id";

export class TokenExchangeAggregate
extends AggregateRoot<TokenExchangeId>{

    exchange(){}

    validate(){}

    deny(){}

    expire(){}

}
