// ============================================================================
// FILE:
// /enterprise/command/IncidentCommandEngine.ts
// ============================================================================

import { Incident } from "./Incident";

export class IncidentCommandEngine{

    activate(

        incident:Incident

    ){

        incident.status="ACTIVE";

        return incident;

    }

}
