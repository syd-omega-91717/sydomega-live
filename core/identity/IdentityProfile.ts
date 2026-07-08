// ============================================================================
// FOUNDATION KERNEL FK-011
// FILE:
// /core/identity/IdentityProfile.ts
// ============================================================================

export interface IdentityProfile{

    id:string;

    did:string;

    username:string;

    email:string;

    verified:boolean;

    status:string;

    createdAt:number;

    updatedAt:number;

}
