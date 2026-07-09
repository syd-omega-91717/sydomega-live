// ============================================================================
// FILE:
// /enterprise/grc/LegalCaseManagementEngine.ts
// ============================================================================

import { LegalCase } from "./LegalCase";

export class LegalCaseManagementEngine{

    manage(

        legalCase:LegalCase

    ){

        return{

            legalCase,

            managed:true

        };

    }

}
