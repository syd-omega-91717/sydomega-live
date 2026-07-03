// ============================================================================
// FILE: /backend/src/modules/search/application/commands/index-document.command.ts
// NEW FILE
// ============================================================================

export class IndexDocumentCommand{

    constructor(

        readonly index:string,

        readonly document:Record<string,unknown>

    ){}

}
