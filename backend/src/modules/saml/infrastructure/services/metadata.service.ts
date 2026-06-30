// ============================================================================
// FILE: /backend/src/modules/saml/infrastructure/services/metadata.service.ts
// NEW FILE
// ============================================================================

export interface MetadataService {

    exportMetadata(): Promise<string>;

}
