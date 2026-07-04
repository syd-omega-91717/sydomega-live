// ============================================================================
// FILE:
// /frontend/services/realtime/eventTypes.ts
// ============================================================================

export type RealtimeEventType =
    | "AI_RESPONSE"
    | "SYSTEM_METRICS"
    | "NOTIFICATION"
    | "GEO_UPDATE"
    | "IOT_TELEMETRY"
    | "BLOCKCHAIN_EVENT"
    | "DIGITAL_TWIN_UPDATE";

export interface RealtimeEvent<T = any> {

    id: string;

    type: RealtimeEventType;

    timestamp: string;

    payload: T;

}
