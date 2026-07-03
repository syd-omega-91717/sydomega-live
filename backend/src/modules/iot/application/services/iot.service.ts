// ============================================================================
// FILE: /backend/src/modules/iot/application/services/iot.service.ts
// NEW FILE
// ============================================================================

export interface IoTService{

    provision():Promise<void>;

    ingestTelemetry():Promise<void>;

    deployFirmware():Promise<void>;

    executeRules():Promise<void>;

}
