// ============================================================================
// FILE: /backend/src/modules/identity/domain/value-objects/access-token.ts
// NEW FILE
// ============================================================================

export class AccessToken{

    constructor(

        readonly value:string,

        readonly expiresAt:Date

    ){}

}
