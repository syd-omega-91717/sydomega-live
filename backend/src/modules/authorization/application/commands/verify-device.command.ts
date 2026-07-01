// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/verify-device.command.ts
// NEW FILE
// ============================================================================

export class VerifyDeviceCommand{

    constructor(

        readonly deviceId:string,

        readonly attestation:string

    ){}

}
