// ============================================================================
// FILE:
// /enterprise/blockchain/DigitalAssetRegistryEngine.ts
// ============================================================================

import { DigitalAsset } from "./DigitalAsset";

export class DigitalAssetRegistryEngine{

    register(

        asset:DigitalAsset

    ){

        return{

            asset,

            registered:true

        };

    }

}
