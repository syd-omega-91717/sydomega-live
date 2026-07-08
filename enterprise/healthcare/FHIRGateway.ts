// ============================================================================
// FILE:
// /enterprise/healthcare/FHIRGateway.ts
// ============================================================================

import { FHIRResource } from "./FHIRResource";

export class FHIRGateway{

    exchange(

        resource:FHIRResource

    ){

        return{

            accepted:true,

            resource

        };

    }

}
