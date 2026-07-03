// ============================================================================
// FILE: /backend/src/modules/event-bus/application/services/event-bus.service.ts
// NEW FILE
// ============================================================================

export interface EventBusService{

    publish():Promise<void>;

    consume():Promise<void>;

    replay():Promise<void>;

    deadLetter():Promise<void>;

}
