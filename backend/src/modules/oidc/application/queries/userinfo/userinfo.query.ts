// ============================================================================
// FILE: /backend/src/modules/oidc/application/queries/userinfo/userinfo.query.ts
// NEW FILE
// ============================================================================

export class UserInfoQuery {

    constructor(

        readonly subject: string,

        readonly scopes: string[]

    ) {}

}
