// ============================================================================
// FILE:
// /core/governance/GovernancePolicy.ts
// ============================================================================

import { GovernanceContext } from "./GovernanceContext";

export interface GovernancePolicy{

    id:string;

    name:string;

    execute(

        context:GovernanceContext

    ):Promise<boolean>;

}
