// ============================================================================
// FILE:
// /enterprise/simulation/SimulationResult.ts
// ============================================================================

export interface SimulationResult{

    id:string;

    scenarioId:string;

    success:boolean;

    score:number;

    completedAt:number;

}
