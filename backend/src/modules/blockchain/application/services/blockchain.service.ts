// ============================================================================
// FILE: /backend/src/modules/blockchain/application/services/blockchain.service.ts
// NEW FILE
// ============================================================================

export interface BlockchainService{

    deployContract():Promise<void>;

    signTransaction():Promise<void>;

    bridgeAssets():Promise<void>;

    synchronize():Promise<void>;

}
