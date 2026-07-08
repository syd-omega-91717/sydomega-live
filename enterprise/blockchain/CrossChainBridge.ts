// ============================================================================
// FILE:
// /enterprise/blockchain/CrossChainBridge.ts
// ============================================================================

export class CrossChainBridge{

    transfer(

        source:string,

        destination:string,

        amount:number

    ){

        return{

            source,

            destination,

            amount,

            transferred:true

        };

    }

}
