// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/connect-session-stream.command.ts
// NEW FILE
// ============================================================================

export class ConnectSessionStreamCommand{

    constructor(

        readonly sessionId:string,

        readonly userId:string

    ){}

}
