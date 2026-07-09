// ============================================================================
// FILE:
// /enterprise/legal/ContractLifecycleEngine.ts
// ============================================================================

import { Contract } from "./Contract";

export class ContractLifecycleEngine{

    activate(

        contract:Contract

    ){

        contract.status="ACTIVE";

        return contract;

    }

}
