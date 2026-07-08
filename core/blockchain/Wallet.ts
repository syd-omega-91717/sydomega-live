// ============================================================================
// FILE:
// /core/blockchain/Wallet.ts
// ============================================================================

import { BlockchainNetwork } from "./BlockchainNetwork";

export interface Wallet{

    id:string;

    userId:string;

    network:BlockchainNetwork;

    address:string;

    publicKey:string;

    active:boolean;

}
