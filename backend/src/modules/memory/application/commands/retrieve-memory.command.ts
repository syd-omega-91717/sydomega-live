// ============================================================================
// FILE: /backend/src/modules/memory/application/commands/retrieve-memory.command.ts
// NEW FILE
// ============================================================================

export class RetrieveMemoryCommand{

    constructor(

        readonly query:string,

        readonly agentId:string

    ){}

}
