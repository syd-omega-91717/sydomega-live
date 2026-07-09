// ============================================================================
// ENTERPRISE CORE EC-045
// FILE:
// /enterprise/blockchain/BlockchainNetwork.ts
// ============================================================================

export interface BlockchainNetwork{

    id:string;

    name:string;

    chainId:number;

    nativeCurrency:string;

    rpcEndpoint:string;

}
