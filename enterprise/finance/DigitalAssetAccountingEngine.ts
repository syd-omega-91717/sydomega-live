// ============================================================================
// FILE:
// /enterprise/finance/DigitalAssetAccountingEngine.ts
// ============================================================================

import { DigitalAssetPosition } from "./DigitalAssetPosition";

export class DigitalAssetAccountingEngine{

    valuate(

        asset:DigitalAssetPosition

    ){

        return{

            asset,

            valuation:asset.valuation

        };

    }

}
