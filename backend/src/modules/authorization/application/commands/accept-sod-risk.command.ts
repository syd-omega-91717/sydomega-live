// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/accept-sod-risk.command.ts
// NEW FILE
// ============================================================================

export class AcceptSodRiskCommand{

    constructor(

        readonly conflictId:string,

        readonly justification:string

    ){}

}
