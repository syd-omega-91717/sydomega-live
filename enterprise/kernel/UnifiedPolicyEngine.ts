// ============================================================================
// FILE:
// /enterprise/kernel/UnifiedPolicyEngine.ts
// ============================================================================

import { SystemPolicy } from "./SystemPolicy";

export class UnifiedPolicyEngine{

    enforce(

        policy:SystemPolicy

    ){

        return{

            policy,

            enforced:true

        };

    }

}
