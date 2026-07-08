// ============================================================================
// FILE:
// /enterprise/data-fabric/DataGovernanceEngine.ts
// ============================================================================

export class DataGovernanceEngine{

    enforce(

        policy:string

    ){

        return{

            policy,

            enforced:true

        };

    }

}
