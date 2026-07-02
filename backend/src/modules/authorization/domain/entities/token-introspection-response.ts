// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/token-introspection-response.ts
// NEW FILE
// ============================================================================

export class TokenIntrospectionResponse{

    constructor(

        readonly active:boolean,

        readonly subject:string,

        readonly audience:string[],

        readonly scopes:string[],

        readonly expiresAt:Date|null

    ){}

}
