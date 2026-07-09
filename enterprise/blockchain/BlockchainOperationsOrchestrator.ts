// ============================================================================
// FILE:
// /enterprise/blockchain/BlockchainOperationsOrchestrator.ts
// ============================================================================

import { CrossChainBridgeEngine } from "./CrossChainBridgeEngine";
import { CustodyWalletEngine } from "./CustodyWalletEngine";
import { DAOGovernanceEngine } from "./DAOGovernanceEngine";
import { DigitalAssetRegistryEngine } from "./DigitalAssetRegistryEngine";
import { MultiChainEngine } from "./MultiChainEngine";
import { NFTInfrastructureEngine } from "./NFTInfrastructureEngine";
import { OnChainAnalyticsEngine } from "./OnChainAnalyticsEngine";
import { SmartContractLifecycleEngine } from "./SmartContractLifecycleEngine";
import { TokenizationEngine } from "./TokenizationEngine";

export class BlockchainOperationsOrchestrator{

    readonly multichain=new MultiChainEngine();

    readonly contracts=new SmartContractLifecycleEngine();

    readonly tokenization=new TokenizationEngine();

    readonly registry=new DigitalAssetRegistryEngine();

    readonly nft=new NFTInfrastructureEngine();

    readonly dao=new DAOGovernanceEngine();

    readonly bridge=new CrossChainBridgeEngine();

    readonly custody=new CustodyWalletEngine();

    readonly analytics=new OnChainAnalyticsEngine();

}
