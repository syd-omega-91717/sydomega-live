// ============================================================================
// FILE: /backend/src/modules/iot/application/commands/deploy-firmware.command.ts
// NEW FILE
// ============================================================================

export class DeployFirmwareCommand{

    constructor(

        readonly firmwareId:string,

        readonly targetGroup:string

    ){}

}
