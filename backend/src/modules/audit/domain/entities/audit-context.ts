// ============================================================================
// FILE: /backend/src/modules/audit/domain/entities/audit-context.ts
// NEW FILE
// ============================================================================

export class AuditContext{

    constructor(

        readonly correlationId:string,

        readonly traceId:string,

        readonly sessionId:string|null,

        readonly userAgent:string,

        readonly tenantId:string|null

    ){}

}
