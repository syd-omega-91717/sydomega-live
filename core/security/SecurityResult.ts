// ============================================================================
// FILE:
// /core/security/SecurityResult.ts
// ============================================================================

export interface SecurityResult{

    success:boolean;

    shield:FortressShield|string;

    score:number;

    message:string;

    timestamp:number;

}
