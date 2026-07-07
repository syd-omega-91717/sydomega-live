// ============================================================================
// FILE:
// /core/governance/InformationEngine.ts
// ============================================================================

import { GovernanceContext } from "./GovernanceContext";

export class InformationEngine{

    async execute(

        context:GovernanceContext

    ){

        return{

            stage:"INFORMATION",

            success:true,

            context

        };

    }

}
