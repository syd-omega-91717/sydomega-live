// ============================================================================
// FILE:
// /enterprise/blockchain/SmartContractRegistry.ts
// ============================================================================

import { SmartContractDefinition } from "./SmartContractDefinition";

export class SmartContractRegistry{

    private readonly contracts=

    new Map<string,SmartContractDefinition>();

    register(

        contract:SmartContractDefinition

    ){

        this.contracts.set(

            contract.id,

            contract

        );

    }

}
