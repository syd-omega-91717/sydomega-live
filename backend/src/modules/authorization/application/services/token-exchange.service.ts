// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/token-exchange.service.ts
// NEW FILE
// ============================================================================

import { TokenExchange }
from "../../domain/entities/token-exchange";

export interface TokenExchangeService{

    exchange(

        subjectToken:string,

        actorToken:string|null

    ):Promise<TokenExchange>;

}
