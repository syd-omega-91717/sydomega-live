// ============================================================================
// FILE: /backend/src/modules/compliance/application/commands/generate-report.command.ts
// NEW FILE
// ============================================================================

export class GenerateReportCommand{

    constructor(

        readonly reportType:string,

        readonly format:string

    ){}

}
