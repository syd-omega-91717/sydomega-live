// ============================================================================
// FILE: /backend/src/modules/iam/application/services/identity.service.ts
// NEW FILE
// ============================================================================

export interface IdentityService{

    authenticate():Promise<void>;

    authorize():Promise<void>;

    provision():Promise<void>;

    revoke():Promise<void>;

}
