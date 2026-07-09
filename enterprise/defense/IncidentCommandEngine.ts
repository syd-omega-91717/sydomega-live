// ============================================================================
// FILE:
// /enterprise/defense/IncidentCommandEngine.ts
// ============================================================================

import { Incident } from "./Incident";

export class IncidentCommandEngine{

    coordinate(

        incident:Incident

    ){

        return{

            incident,

            coordinated:true

        };

    }

}
