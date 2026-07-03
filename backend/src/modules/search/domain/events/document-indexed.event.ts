// ============================================================================
// FILE: /backend/src/modules/search/domain/events/document-indexed.event.ts
// NEW FILE
// ============================================================================

export class DocumentIndexedEvent{

    constructor(

        readonly documentId:string,

        readonly indexName:string

    ){}

}
