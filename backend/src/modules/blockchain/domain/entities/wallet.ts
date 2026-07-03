// ============================================================================
// FILE: /backend/src/modules/blockchain/domain/entities/wallet.ts
// NEW FILE
// ============================================================================

import { LedgerId }
from "../value-objects/ledger-id";

export class Wallet{

    constructor(

        readonly id:LedgerId,

        readonly address:string,

        readonly network:BlockchainNetwork,

        readonly multiSignature:boolean,

        readonly hardwareProtected:boolean

    ){}

}
