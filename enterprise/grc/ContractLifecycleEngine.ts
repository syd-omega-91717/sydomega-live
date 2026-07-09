// ============================================================================
// FILE:
// /enterprise/grc/ContractLifecycleEngine.ts
// ============================================================================

export class ContractLifecycleEngine{

    activate(

        contractId:string

    ){

        return{

            contractId,

            active:true

        };

    }

}
