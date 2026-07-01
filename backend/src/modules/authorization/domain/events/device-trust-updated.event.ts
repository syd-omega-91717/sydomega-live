// ============================================================================
// FILE: /backend/src/modules/authorization/domain/events/device-trust-updated.event.ts
// NEW FILE
// ============================================================================

export class DeviceTrustUpdatedEvent{

    constructor(

        readonly deviceId:string,

        readonly trustLevel:string

    ){}

}
