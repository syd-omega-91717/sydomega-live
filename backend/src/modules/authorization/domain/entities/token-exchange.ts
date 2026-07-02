// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/token-exchange.ts
// NEW FILE
// ============================================================================

import { TokenExchangeId }
from "../value-objects/token-exchange-id";

import { TokenExchangeStatus }
from "../enums/token-exchange-status";

export class TokenExchange{

    constructor(

        readonly id:TokenExchangeId,

        readonly subjectToken:string,

        readonly actorToken:string|null,

        readonly requestedTokenType:string,

        readonly issuedTokenType:string,

        readonly status:TokenExchangeStatus,

        readonly exchangedAt:Date

    ){}

}
