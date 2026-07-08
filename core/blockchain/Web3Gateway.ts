// ============================================================================
// FILE:
// /core/blockchain/Web3Gateway.ts
// ============================================================================

export class Web3Gateway{

    connect(

        network:string

    ){

        return{

            network,

            connected:true

        };

    }

}
