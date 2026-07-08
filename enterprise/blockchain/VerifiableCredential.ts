// ============================================================================
// FILE:
// /enterprise/blockchain/VerifiableCredential.ts
// ============================================================================

export interface VerifiableCredential{

    id:string;

    issuer:string;

    holder:string;

    type:string[];

    issuedAt:number;

    expiresAt:number;

    revoked:boolean;

}
