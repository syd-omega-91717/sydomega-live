// ============================================================================
// FILE: /backend/src/modules/identity/application/commands/login/login.command.ts
// NEW FILE
// ============================================================================

export class LoginCommand {

    constructor(

        readonly identifier: string,

        readonly password: string,

        readonly deviceFingerprint: string,

        readonly ipAddress: string,

        readonly userAgent: string

    ){}

}
