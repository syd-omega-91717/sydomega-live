// ============================================================================
// ENTERPRISE CORE EC-053
// FILE:
// /enterprise/strategy/StrategicObjective.ts
// ============================================================================

export interface StrategicObjective{

    id:string;

    title:string;

    owner:string;

    priority:"LOW"|"MEDIUM"|"HIGH"|"CRITICAL";

    status:string;

}
