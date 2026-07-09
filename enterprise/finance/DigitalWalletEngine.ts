// ============================================================================
// FILE:
// /enterprise/finance/DigitalWalletEngine.ts
// ============================================================================

import { DigitalWallet } from "./DigitalWallet";

export class DigitalWalletEngine{

    activate(

        wallet:DigitalWallet

    ){

        return{

            wallet,

            activated:true

        };

    }

}
