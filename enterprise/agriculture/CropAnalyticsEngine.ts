// ============================================================================
// FILE:
// /enterprise/agriculture/CropAnalyticsEngine.ts
// ============================================================================

import { Crop } from "./Crop";

export class CropAnalyticsEngine{

    analyze(

        crop:Crop

    ){

        return{

            crop,

            yieldPredictionReady:true

        };

    }

}
