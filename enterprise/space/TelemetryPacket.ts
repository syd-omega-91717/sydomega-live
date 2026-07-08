// ============================================================================
// FILE:
// /enterprise/space/TelemetryPacket.ts
// ============================================================================

export interface TelemetryPacket{

    satelliteId:string;

    timestamp:number;

    latitude:number;

    longitude:number;

    altitude:number;

    payload:Record<string,unknown>;

}
