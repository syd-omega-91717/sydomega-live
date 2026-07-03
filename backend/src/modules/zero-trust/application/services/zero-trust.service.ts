// ============================================================================
// FILE: /backend/src/modules/zero-trust/application/services/zero-trust.service.ts
// NEW FILE
// ============================================================================

export interface ZeroTrustService{

    authenticate():Promise<void>;

    authorize():Promise<void>;

    verifyDevice():Promise<void>;

    verifyWorkload():Promise<void>;

}
