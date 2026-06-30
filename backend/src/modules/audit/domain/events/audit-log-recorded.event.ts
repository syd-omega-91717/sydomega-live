// ============================================================================
// FILE: /backend/src/modules/audit/domain/events/audit-log-recorded.event.ts
// NEW FILE
// ============================================================================

export class AuditLogRecordedEvent{

    constructor(

        readonly auditLogId:string

    ){}

}
