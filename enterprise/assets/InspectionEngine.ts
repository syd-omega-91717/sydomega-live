// ============================================================================
// FILE:
// /enterprise/assets/InspectionEngine.ts
// ============================================================================

import { Inspection } from "./Inspection";

export class InspectionEngine{

    execute(

        inspection:Inspection

    ){

        inspection.status="PASSED";

        return inspection;

    }

}
