// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/register-device.command.ts
// NEW FILE
// ============================================================================

export class RegisterDeviceCommand{

    constructor(

        readonly principalId:string,

        readonly fingerprint:string,

        readonly platform:string

    ){}

}
