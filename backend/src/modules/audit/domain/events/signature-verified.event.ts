// ============================================================================
// FILE: /backend/src/modules/audit/domain/events/signature-verified.event.ts
// NEW FILE
// ============================================================================

export class SignatureVerifiedEvent{

    constructor(

        readonly signatureId:string,

        readonly valid:boolean

    ){}

}
