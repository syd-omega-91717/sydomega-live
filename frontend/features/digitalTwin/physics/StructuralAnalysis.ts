// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/StructuralAnalysis.ts
// ============================================================================

export interface StressResult{

    stress:number;

    strain:number;

    safetyFactor:number;

}

export class StructuralAnalysis{

    analyze(

        load:number,

        capacity:number

    ):StressResult{

        return{

            stress:load,

            strain:load/capacity,

            safetyFactor:

            capacity/load

        };

    }

}
