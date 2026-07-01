// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/token-introspection.ts
// NEW FILE
// ============================================================================

export class TokenIntrospection{

    constructor(

        readonly tokenId:string,

        readonly active:boolean,

        readonly subject:string,

        readonly expiresAt:Date

    ){}

}
