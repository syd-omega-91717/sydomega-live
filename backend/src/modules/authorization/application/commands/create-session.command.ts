// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/create-session.command.ts
// NEW FILE
// ============================================================================

export class CreateSessionCommand{

    constructor(

        readonly principalId:string,

        readonly deviceId:string,

        readonly ipAddress:string

    ){}

}
