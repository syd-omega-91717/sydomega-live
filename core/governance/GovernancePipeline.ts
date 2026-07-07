// ============================================================================
// FILE:
// /core/governance/GovernancePipeline.ts
// ============================================================================

import { GovernancePolicy } from "./GovernancePolicy";
import { GovernanceContext } from "./GovernanceContext";

export class GovernancePipeline{

    private readonly policies:GovernancePolicy[]=[];

    register(

        policy:GovernancePolicy

    ){

        this.policies.push(policy);

    }

    async execute(

        context:GovernanceContext

    ){

        for(const policy of this.policies){

            const approved=

            await policy.execute(context);

            if(!approved){

                return false;

            }

        }

        return true;

    }

}
