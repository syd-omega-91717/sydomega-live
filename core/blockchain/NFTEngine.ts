// ============================================================================
// FILE:
// /core/blockchain/NFTEngine.ts
// ============================================================================

export class NFTEngine{

    mint(

        owner:string,

        metadata:string

    ){

        return{

            owner,

            metadata,

            tokenId:crypto.randomUUID()

        };

    }

}
