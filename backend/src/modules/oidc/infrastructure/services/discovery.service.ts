// ============================================================================
// FILE: /backend/src/modules/oidc/infrastructure/services/discovery.service.ts
// NEW FILE
// ============================================================================

export interface DiscoveryService {

    configuration(): Promise<object>;

}
