// ============================================================================
// FILE:
// /enterprise/operations/IncidentManagementEngine.ts
// ============================================================================

import { Incident } from "./Incident";

export class IncidentManagementEngine{

    resolve(

        incident:Incident

    ){

        return{

            incident,

            resolved:true

        };

    }

}
