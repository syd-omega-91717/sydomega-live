// ============================================================================
// FILE:
// /core/identity/IdentityCredential.ts
// ============================================================================

export interface IdentityCredential{

    id:string;

    userId:string;

    type:string;

    issuer:string;

    issuedAt:number;

    expiresAt?:number;

}
