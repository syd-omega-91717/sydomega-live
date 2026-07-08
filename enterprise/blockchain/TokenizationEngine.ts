// ============================================================================
// FILE:
// /enterprise/blockchain/TokenizationEngine.ts
// ============================================================================

import { TokenizedAsset } from "./TokenizedAsset";

export class TokenizationEngine{

    tokenize(

        asset:TokenizedAsset

    ){

        return{

            tokenized:true,

            asset

        };

    }

}
