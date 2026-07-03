// ============================================================================
// FILE: /backend/src/modules/governance/application/commands/approve-model.command.ts
// NEW FILE
// ============================================================================

export class ApproveModelCommand{

    constructor(

        readonly modelId:string,

        readonly approver:string

    ){}

}
