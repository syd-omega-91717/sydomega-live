// ============================================================================
// FILE:
// /enterprise/kernel/EnterpriseServiceRegistryEngine.ts
// ============================================================================

import { PlatformService } from "./PlatformService";

export class EnterpriseServiceRegistryEngine{

    register(

        service:PlatformService

    ){

        return{

            service,

            registered:true

        };

    }

}
