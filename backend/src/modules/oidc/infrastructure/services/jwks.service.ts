// ============================================================================
// FILE: /backend/src/modules/oidc/infrastructure/services/jwks.service.ts
// NEW FILE
// ============================================================================

export interface JwksService {

    getPublicKeys(): Promise<object>;

}
