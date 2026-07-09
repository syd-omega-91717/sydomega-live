// ============================================================================
// FILE:
// /enterprise/legal/LegalCaseManagementEngine.ts
// ============================================================================

import { LegalCase } from "./LegalCase";

export class LegalCaseManagementEngine{

    assign(

        legalCase:LegalCase,

        attorney:string

    ){

        return{

            legalCase,

            attorney,

            assigned:true

        };

    }

}
