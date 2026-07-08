// ============================================================================
// FILE:
// /enterprise/blockchain/SovereignIdentityRuntime.ts
// ============================================================================

import { BlockchainEventEngine } from "./BlockchainEventEngine";
import { CredentialEngine } from "./CredentialEngine";
import { CrossChainBridge } from "./CrossChainBridge";
import { CryptographicVault } from "./CryptographicVault";
import { DIDRegistry } from "./DIDRegistry";
import { NFTRegistry } from "./NFTRegistry";
import { SmartContractRegistry } from "./SmartContractRegistry";
import { TokenizationEngine } from "./TokenizationEngine";
import { WalletManager } from "./WalletManager";

export class SovereignIdentityRuntime{

    readonly did=

    new DIDRegistry();

    readonly credentials=

    new CredentialEngine();

    readonly contracts=

    new SmartContractRegistry();

    readonly wallets=

    new WalletManager();

    readonly tokenization=

    new TokenizationEngine();

    readonly nfts=

    new NFTRegistry();

    readonly vault=

    new CryptographicVault();

    readonly bridge=

    new CrossChainBridge();

    readonly events=

    new BlockchainEventEngine();

}
