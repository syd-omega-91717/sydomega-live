// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/issue-access-token.command.ts
// NEW FILE
// ============================================================================

export class IssueAccessTokenCommand{

    constructor(

        readonly principalId:string,

        readonly scopes:string[]

    ){}

}
