// ============================================================================
// FILE: /backend/src/modules/identity/application/services/behavior-engine.service.ts
// NEW FILE
// ============================================================================

export interface BehaviorEngineService{

    analyze(

        userId:string,

        sessionId:string

    ):Promise<number>;

}
