// ============================================================================
// FILE:
// /enterprise/blockchain/DigitalAsset.ts
// ============================================================================

export interface DigitalAsset{

    id:string;

    symbol:string;

    assetType:"TOKEN"|"NFT"|"STABLECOIN"|"CBDC";

    owner:string;

    chain:string;

}
