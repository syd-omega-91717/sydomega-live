// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/issue-refresh-token.command.ts
// NEW FILE
// ============================================================================

export class IssueRefreshTokenCommand{

    constructor(

        readonly sessionId:string,

        readonly principalId:string

    ){}

}
