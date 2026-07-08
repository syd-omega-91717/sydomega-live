// ============================================================================
// FILE:
// /core/blockchain/StakingEngine.ts
// ============================================================================

export class StakingEngine{

    stake(

        wallet:string,

        amount:number

    ){

        return{

            wallet,

            amount,

            stakedAt:Date.now()

        };

    }

}
