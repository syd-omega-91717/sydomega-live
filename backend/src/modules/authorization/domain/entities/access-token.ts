// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/access-token.ts
// NEW FILE
// ============================================================================

import { AccessTokenId }
from "../value-objects/access-token-id";

import { TokenType }
from "../enums/token-type";

import { TokenStatus }
from "../enums/token-status";

export class AccessToken{

    constructor(

        readonly id:AccessTokenId,

        readonly principalId:string,

        readonly type:TokenType,

        readonly status:TokenStatus,

        readonly issuedAt:Date,

        readonly expiresAt:Date,

        readonly scopes:string[]

    ){}

}
