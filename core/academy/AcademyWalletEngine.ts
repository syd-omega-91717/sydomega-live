// ============================================================================
// FILE:
// /core/academy/AcademyWalletEngine.ts
// ============================================================================

export class AcademyWalletEngine{

    charge(

        amount:number

    ){

        return{

            amount,

            processed:true,

            timestamp:Date.now()

        };

    }

}
