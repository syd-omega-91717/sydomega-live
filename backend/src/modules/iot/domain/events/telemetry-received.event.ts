// ============================================================================
// FILE: /backend/src/modules/iot/domain/events/telemetry-received.event.ts
// NEW FILE
// ============================================================================

export class TelemetryReceivedEvent{

    constructor(

        readonly deviceId:string,

        readonly telemetryId:string

    ){}

}
