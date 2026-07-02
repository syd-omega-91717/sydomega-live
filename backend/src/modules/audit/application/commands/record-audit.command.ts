// ============================================================================
// FILE: /backend/src/modules/audit/application/commands/record-audit.command.ts
// NEW FILE
// ============================================================================

export class RecordAuditCommand{

    constructor(

        readonly action:string,

        readonly category:string,

        readonly severity:string,

        readonly resource:string

    ){}

}
