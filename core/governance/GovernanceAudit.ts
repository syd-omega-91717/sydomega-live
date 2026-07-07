// ============================================================================
// FILE:
// /core/governance/GovernanceAudit.ts
// ============================================================================

import { GovernanceResult } from "./GovernanceResult";

export class GovernanceAudit{

    private readonly history:GovernanceResult[]=[];

    record(

        result:GovernanceResult

    ){

        this.history.push(result);

    }

    all(){

        return this.history;

    }

}
