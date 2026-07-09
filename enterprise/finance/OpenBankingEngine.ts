// ============================================================================
// FILE:
// /enterprise/finance/OpenBankingEngine.ts
// ============================================================================

export class OpenBankingEngine{

    connect(

        institutionId:string

    ){

        return{

            institutionId,

            connected:true

        };

    }

}
