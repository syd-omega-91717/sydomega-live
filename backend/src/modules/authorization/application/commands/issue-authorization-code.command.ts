// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/issue-authorization-code.command.ts
// NEW FILE
// ============================================================================

export class IssueAuthorizationCodeCommand{

    constructor(

        readonly clientId:string,

        readonly principalId:string,

        readonly redirectUri:string,

        readonly scopes:string[],

        readonly codeChallenge:string,

        readonly method:string

    ){}

}
