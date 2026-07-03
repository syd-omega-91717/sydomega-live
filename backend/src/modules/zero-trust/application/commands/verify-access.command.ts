// ============================================================================
// FILE: /backend/src/modules/zero-trust/application/commands/verify-access.command.ts
// NEW FILE
// ============================================================================

export class VerifyAccessCommand{

    constructor(

        readonly subjectId:string,

        readonly resource:string

    ){}

}
