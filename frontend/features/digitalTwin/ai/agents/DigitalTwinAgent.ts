// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/agents/DigitalTwinAgent.ts
// ============================================================================

export interface DigitalTwinAgent{

    id:string;

    name:string;

    initialize():Promise<void>;

    execute(input:unknown):Promise<unknown>;

    shutdown():Promise<void>;

}
