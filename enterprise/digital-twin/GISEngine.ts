// ============================================================================
// FILE:
// /enterprise/digital-twin/GISEngine.ts
// ============================================================================

import { GISLocation } from "./GISLocation";

export class GISEngine{

    map(

        location:GISLocation

    ){

        return{

            mapped:true,

            location

        };

    }

}
