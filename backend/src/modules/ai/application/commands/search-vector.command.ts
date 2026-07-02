// ============================================================================
// FILE: /backend/src/modules/ai/application/commands/search-vector.command.ts
// NEW FILE
// ============================================================================

export class SearchVectorCommand{

    constructor(

        readonly query:string,

        readonly limit:number

    ){}

}
