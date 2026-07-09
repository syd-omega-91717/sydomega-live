// ============================================================================
// FILE:
// /enterprise/grc/PolicyManagementEngine.ts
// ============================================================================

import { Policy } from "./Policy";

export class PolicyManagementEngine{

    publish(

        policy:Policy

    ){

        return{

            policy,

            published:true

        };

    }

}
