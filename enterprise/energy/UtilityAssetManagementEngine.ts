// ============================================================================
// FILE:
// /enterprise/energy/UtilityAssetManagementEngine.ts
// ============================================================================

import { UtilityAsset } from "./UtilityAsset";

export class UtilityAssetManagementEngine{

    inspect(

        asset:UtilityAsset

    ){

        return{

            asset,

            inspectionCompleted:true

        };

    }

}
