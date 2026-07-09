// ============================================================================
// FILE:
// /enterprise/blockchain/SmartContractLifecycleEngine.ts
// ============================================================================

import { SmartContract } from "./SmartContract";

export class SmartContractLifecycleEngine{

    deploy(

        contract:SmartContract

    ){

        return{

            contract,

            deployed:true

        };

    }

}
