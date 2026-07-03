// ============================================================================
// FILE: /backend/src/modules/iot/domain/entities/telemetry-record.ts
// NEW FILE
// ============================================================================

export class TelemetryRecord{

    constructor(

        readonly deviceId:string,

        readonly timestamp:Date,

        readonly metrics:Record<string,number>

    ){}

}
