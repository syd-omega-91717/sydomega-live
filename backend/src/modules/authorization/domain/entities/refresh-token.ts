// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/refresh-token.ts
// NEW FILE
// ============================================================================

import { RefreshTokenId }
from "../value-objects/refresh-token-id";

import { RefreshTokenStatus }
from "../enums/refresh-token-status";

export class RefreshToken{

    constructor(

        readonly id:RefreshTokenId,

        readonly sessionId:string,

        readonly principalId:string,

        readonly tokenHash:string,

        readonly familyId:string,

        readonly status:RefreshTokenStatus,

        readonly issuedAt:Date,

        readonly expiresAt:Date

    ){}

}
