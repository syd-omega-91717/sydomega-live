// ============================================================================
// FILE: /backend/src/modules/digital-twin/application/services/digital-twin.service.ts
// NEW FILE
// ============================================================================

export interface DigitalTwinService{

    synchronize():Promise<void>;

    simulate():Promise<void>;

    replay():Promise<void>;

    predict():Promise<void>;

}
