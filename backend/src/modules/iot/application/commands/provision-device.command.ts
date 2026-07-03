// ============================================================================
// FILE: /backend/src/modules/iot/application/commands/provision-device.command.ts
// NEW FILE
// ============================================================================

export class ProvisionDeviceCommand{

    constructor(

        readonly serialNumber:string,

        readonly protocol:string,

        readonly tenantId:string

    ){}

}
