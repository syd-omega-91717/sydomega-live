// ============================================================================
// FILE:
// /core/blockchain/BlockchainRuntime.ts
// ============================================================================

import { BlockchainAuditEngine } from "./BlockchainAuditEngine";
import { BridgeEngine } from "./BridgeEngine";
import { ContractRegistry } from "./ContractRegistry";
import { CustodyEngine } from "./CustodyEngine";
import { GovernanceVotingEngine } from "./GovernanceVotingEngine";
import { NFTEngine } from "./NFTEngine";
import { OmegaTokenEngine } from "./OmegaTokenEngine";
import { StakingEngine } from "./StakingEngine";
import { TransactionEngine } from "./TransactionEngine";
import { WalletEngine } from "./WalletEngine";
import { Web3Gateway } from "./Web3Gateway";

export class BlockchainRuntime{

    readonly wallets=new WalletEngine();

    readonly transactions=new TransactionEngine();

    readonly omega=new OmegaTokenEngine();

    readonly nft=new NFTEngine();

    readonly contracts=new ContractRegistry();

    readonly staking=new StakingEngine();

    readonly governance=new GovernanceVotingEngine();

    readonly bridges=new BridgeEngine();

    readonly custody=new CustodyEngine();

    readonly audit=new BlockchainAuditEngine();

    readonly web3=new Web3Gateway();

}
