// ============================================================================
// FILE:
// /enterprise/blockchain/CrossChainBridgeEngine.ts
// ============================================================================

export class CrossChainBridgeEngine{

    bridge(

        assetId:string,

        sourceChain:string,

        destinationChain:string

    ){

        return{

            assetId,

            sourceChain,

            destinationChain,

            transferred:true

        };

    }

}
