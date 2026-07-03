// ============================================================================
// FILE: /backend/src/modules/search/application/commands/search.command.ts
// NEW FILE
// ============================================================================

export class SearchCommand{

    constructor(

        readonly query:string,

        readonly type:string

    ){}

}
