// ============================================================================
// FILE:
// /enterprise/digital-twin/TelemetryPacket.ts
// ============================================================================

export interface TelemetryPacket{

    id:string;

    deviceId:string;

    timestamp:number;

    values:Record<string,number>;

}
