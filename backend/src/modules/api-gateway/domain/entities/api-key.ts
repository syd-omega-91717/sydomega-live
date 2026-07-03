// ============================================================================
// FILE: /backend/src/modules/api-gateway/domain/entities/api-key.ts
// NEW FILE
// ============================================================================

export class ApiKey{

    constructor(

        readonly keyId:string,

        readonly tenantId:string,

        readonly scopes:string[],

        readonly expiresAt:Date|null,

        readonly enabled:boolean

    ){}

}
