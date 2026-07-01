// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/mitigate-sod-conflict.command.ts
// NEW FILE
// ============================================================================

export class MitigateSodConflictCommand{

    constructor(

        readonly conflictId:string,

        readonly justification:string,

        readonly expiresAt:Date|null

    ){}

}
