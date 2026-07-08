// ============================================================================
// FILE:
// /core/blockchain/WalletEngine.ts
// ============================================================================

import { Wallet } from "./Wallet";

export class WalletEngine{

    create(

        wallet:Wallet

    ){

        return{

            ...wallet,

            createdAt:Date.now()

        };

    }

}
