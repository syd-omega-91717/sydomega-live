// ============================================================================
// FILE: /backend/src/modules/audit/application/commands/write-audit-log.command.ts
// NEW FILE
// ============================================================================

export class WriteAuditLogCommand{

    constructor(

        readonly tenantId:string,

        readonly actorId:string,

        readonly action:string,

        readonly resource:string,

        readonly metadata:Record<string,unknown>

    ){}

}
