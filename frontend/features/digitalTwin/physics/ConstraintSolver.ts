// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/ConstraintSolver.ts
// ============================================================================

export interface Constraint{

    id:string;

    enabled:boolean;

}

export class ConstraintSolver{

    solve(

        constraints:Constraint[]

    ){

        return constraints.filter(

            c=>c.enabled

        ).length;

    }

}
