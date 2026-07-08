// ============================================================================
// FILE:
// /enterprise/assets/FacilityManagementEngine.ts
// ============================================================================

import { Facility } from "./Facility";

export class FacilityManagementEngine{

    activate(

        facility:Facility

    ){

        facility.active=true;

        return facility;

    }

}
