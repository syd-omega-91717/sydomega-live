// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/issue-device-code.command.ts
// NEW FILE
// ============================================================================

export class IssueDeviceCodeCommand{

    constructor(

        readonly clientId:string,

        readonly scopes:string[]

    ){}

}
