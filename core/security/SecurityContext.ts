// ============================================================================
// FILE:
// /core/security/SecurityContext.ts
// ============================================================================

export interface SecurityContext{

    requestId:string;

    tenantId:string;

    userId:string;

    module:string;

    ip:string;

    deviceId:string;

    timestamp:number;

}
