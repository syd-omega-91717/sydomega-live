// ============================================================================
// FILE: /backend/src/modules/audit/application/services/audit-export.service.ts
// NEW FILE
// ============================================================================

export interface AuditExportService{

    export(

        tenantId:string,

        from:Date,

        to:Date

    ):Promise<Buffer>;

}
