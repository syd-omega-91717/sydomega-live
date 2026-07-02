// ============================================================================
// FILE: /backend/src/modules/compliance/application/commands/collect-evidence.command.ts
// NEW FILE
// ============================================================================

export class CollectEvidenceCommand{

    constructor(

        readonly controlId:string,

        readonly source:string

    ){}

}
