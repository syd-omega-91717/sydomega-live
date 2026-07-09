// ============================================================================
// FILE:
// /enterprise/space/OrbitalMechanicsEngine.ts
// ============================================================================

export class OrbitalMechanicsEngine{

    propagate(

        satelliteId:string

    ){

        return{

            satelliteId,

            propagated:true

        };

    }

}
