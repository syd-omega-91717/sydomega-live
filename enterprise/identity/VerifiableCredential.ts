// ============================================================================
// FILE:
// /enterprise/identity/VerifiableCredential.ts
// ============================================================================

export interface VerifiableCredential{

    id:string;

    issuer:string;

    subject:string;

    credentialType:string;

    issuedAt:string;

}
