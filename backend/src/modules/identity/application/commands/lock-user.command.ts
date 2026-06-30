// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/lock-user.command.ts
// NEW FILE
// ============================================================================

export class LockUserCommand{

    constructor(

        readonly administratorId:string,

        readonly userId:string,

        readonly reason:string

    ){}

}
