// ============================================================================
// FILE:
// /enterprise/defense/CriticalInfrastructureProtectionEngine.ts
// ============================================================================

import { CriticalInfrastructureAsset } from "./CriticalInfrastructureAsset";

export class CriticalInfrastructureProtectionEngine{

    monitor(

        asset:CriticalInfrastructureAsset

    ){

        return{

            asset,

            protected:true

        };

    }

}
