// ============================================================================
// FILE: /backend/src/modules/saml/domain/value-objects/name-id-format.ts
// NEW FILE
// ============================================================================

export enum NameIdFormat {

    EmailAddress = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",

    Persistent = "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",

    Transient = "urn:oasis:names:tc:SAML:2.0:nameid-format:transient",

    Unspecified = "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"

}
