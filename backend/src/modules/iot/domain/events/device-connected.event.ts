// ============================================================================
// FILE: /backend/src/modules/iot/domain/events/device-connected.event.ts
// NEW FILE
// ============================================================================

export class DeviceConnectedEvent{

    constructor(

        readonly deviceId:string,

        readonly timestamp:Date

    ){}

}
