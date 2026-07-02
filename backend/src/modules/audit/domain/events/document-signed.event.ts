// ============================================================================
// FILE: /backend/src/modules/audit/domain/events/document-signed.event.ts
// NEW FILE
// ============================================================================

export class DocumentSignedEvent{

    constructor(

        readonly signatureId:string

    ){}

}
