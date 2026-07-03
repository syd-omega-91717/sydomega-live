// ============================================================================
// FILE: /backend/src/modules/search/domain/entities/search-document.ts
// NEW FILE
// ============================================================================

export class SearchDocument{

    constructor(

        readonly documentId:string,

        readonly indexName:string,

        readonly content:Record<string,unknown>,

        readonly vectorId:string|null,

        readonly updatedAt:Date

    ){}

}
