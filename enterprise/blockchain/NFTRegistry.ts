// ============================================================================
// FILE:
// /enterprise/blockchain/NFTRegistry.ts
// ============================================================================

import { NFTAsset } from "./NFTAsset";

export class NFTRegistry{

    private readonly nfts=

    new Map<string,NFTAsset>();

    register(

        nft:NFTAsset

    ){

        this.nfts.set(

            nft.id,

            nft

        );

    }

}
