// ============================================================================
// FILE:
// /enterprise/kernel/PlatformCapabilityRegistryEngine.ts
// ============================================================================

import { SystemCapability } from "./SystemCapability";

export class PlatformCapabilityRegistryEngine{

    publish(

        capability:SystemCapability

    ){

        return{

            capability,

            published:true

        };

    }

}
