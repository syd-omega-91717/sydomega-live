// ============================================================================
// FILE:
// /enterprise/media/DigitalAssetManagementEngine.ts
// ============================================================================

import { DigitalAsset } from "./DigitalAsset";

export class DigitalAssetManagementEngine{

    register(

        asset:DigitalAsset

    ){

        return{

            asset,

            registered:true

        };

    }

}
