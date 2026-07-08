// ============================================================================
// FILE:
// /enterprise/blockchain/BlockchainEventEngine.ts
// ============================================================================

export class BlockchainEventEngine{

    subscribe(

        contract:string

    ){

        return{

            contract,

            subscribed:true

        };

    }

}
