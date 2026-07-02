// ============================================================================
// FILE: /backend/src/modules/ai/application/commands/retrieve-context.command.ts
// NEW FILE
// ============================================================================

export class RetrieveContextCommand{

    constructor(

        readonly query:string,

        readonly tenantId:string

    ){}

}
