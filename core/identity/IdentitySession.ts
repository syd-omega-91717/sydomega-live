// ============================================================================
// FILE:
// /core/identity/IdentitySession.ts
// ============================================================================

export interface IdentitySession{

    id:string;

    userId:string;

    deviceId:string;

    ipAddress:string;

    createdAt:number;

    expiresAt:number;

    active:boolean;

}
