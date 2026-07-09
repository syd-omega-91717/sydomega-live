// ============================================================================
// FILE:
// /enterprise/manufacturing/IndustrialIoTEngine.ts
// ============================================================================

import { IndustrialAsset } from "./IndustrialAsset";

export class IndustrialIoTEngine{

    connect(

        asset:IndustrialAsset

    ){

        return{

            asset,

            connected:true

        };

    }

}
