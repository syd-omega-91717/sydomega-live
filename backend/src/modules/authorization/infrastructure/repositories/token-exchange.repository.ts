// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/token-exchange.repository.ts
// NEW FILE
// ============================================================================

import { TokenExchangeAggregate }
from "../../domain/aggregates/token-exchange.aggregate";

export interface TokenExchangeRepository{

    save(

        aggregate:TokenExchangeAggregate

    ):Promise<void>;

}
