// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/id-token.ts
// NEW FILE
// ============================================================================

export class IdToken{

    constructor(

        readonly issuer:string,

        readonly subject:string,

        readonly audience:string[],

        readonly nonce:string|null,

        readonly authenticationTime:Date,

        readonly issuedAt:Date,

        readonly expiresAt:Date,

        readonly acr:string,

        readonly amr:string[]

    ){}

}
