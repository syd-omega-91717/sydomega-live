// ============================================================================
// FILE:
// /enterprise/blockchain/WalletManager.ts
// ============================================================================

import { BlockchainWallet } from "./BlockchainWallet";

export class WalletManager{

    private readonly wallets=

    new Map<string,BlockchainWallet>();

    add(

        wallet:BlockchainWallet

    ){

        this.wallets.set(

            wallet.id,

            wallet

        );

    }

}
