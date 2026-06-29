// ============================================================================
// FILE: /backend/src/modules/identity/domain/value-objects/refresh-token.ts
// NEW FILE
// ============================================================================

export class RefreshToken{

    constructor(

        readonly value:string,

        readonly expiresAt:Date,

        readonly version:number

    ){}

}
