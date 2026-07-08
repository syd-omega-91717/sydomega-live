// ============================================================================
// FILE:
// /enterprise/grc/AuditRecord.ts
// ============================================================================

export interface AuditRecord{

    id:string;

    auditName:string;

    auditor:string;

    scope:string;

    startedAt:number;

    completed:boolean;

}
