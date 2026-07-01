// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/authorize-device-code.command.ts
// NEW FILE
// ============================================================================

export class AuthorizeDeviceCodeCommand{

    constructor(

        readonly userCode:string,

        readonly principalId:string

    ){}

}
