// ============================================================================
// FILE:
// /enterprise/government/SmartCityPlatformEngine.ts
// ============================================================================

import { SmartCity } from "./SmartCity";

export class SmartCityPlatformEngine{

    deploy(

        city:SmartCity

    ){

        return{

            city,

            deployed:true

        };

    }

}
