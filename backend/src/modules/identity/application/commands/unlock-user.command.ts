// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/unlock-user.command.ts
// NEW FILE
// ============================================================================

export class UnlockUserCommand{

    constructor(

        readonly administratorId:string,

        readonly userId:string

    ){}

}
