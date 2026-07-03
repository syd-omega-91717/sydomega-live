// ============================================================================
// FILE: /backend/src/modules/search/domain/entities/search-result.ts
// NEW FILE
// ============================================================================

export class SearchResult{

    constructor(

        readonly id:string,

        readonly score:number,

        readonly highlights:string[],

        readonly source:Record<string,unknown>

    ){}

}
