// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/service-account-secret.ts
// NEW FILE
// ============================================================================

export class ServiceAccountSecret{

    constructor(

        readonly serviceAccountId:string,

        readonly secretId:string,

        readonly expiresAt:Date

    ){}

}
