// ============================================================================
// FILE: /backend/src/modules/memory/application/commands/store-memory.command.ts
// NEW FILE
// ============================================================================

export class StoreMemoryCommand{

    constructor(

        readonly agentId:string,

        readonly content:string,

        readonly type:string

    ){}

}
