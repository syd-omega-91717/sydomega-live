// ============================================================================
// FILE:
// /core/blockchain/BridgeEngine.ts
// ============================================================================

export class BridgeEngine{

    bridge(

        source:string,

        destination:string,

        amount:number

    ){

        return{

            source,

            destination,

            amount,

            status:"PROCESSING"

        };

    }

}
