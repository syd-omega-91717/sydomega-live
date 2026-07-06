// ============================================================================
// FILE:
// /frontend/features/digitalTwin/physics/SoftBodySystem.ts
// ============================================================================

export interface SoftNode{

    x:number;

    y:number;

    z:number;

}

export class SoftBodySystem{

    simulate(

        nodes:SoftNode[]

    ){

        return nodes.map(node=>({

            ...node

        }));

    }

}
