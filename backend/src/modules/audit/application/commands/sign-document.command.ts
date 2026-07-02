// ============================================================================
// FILE: /backend/src/modules/audit/application/commands/sign-document.command.ts
// NEW FILE
// ============================================================================

export class SignDocumentCommand{

    constructor(

        readonly documentHash:string,

        readonly certificateId:string

    ){}

}
