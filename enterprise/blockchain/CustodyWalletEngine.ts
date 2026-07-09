// ============================================================================
// FILE:
// /enterprise/blockchain/CustodyWalletEngine.ts
// ============================================================================

export class CustodyWalletEngine{

    createWallet(

        ownerId:string

    ){

        return{

            ownerId,

            walletCreated:true

        };

    }

    signTransaction(

        walletId:string,

        transactionId:string

    ){

        return{

            walletId,

            transactionId,

            signed:true

        };

    }

}
