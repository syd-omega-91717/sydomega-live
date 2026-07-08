// ============================================================================
// FILE:
// /enterprise/security/IncidentResponseEngine.ts
// ============================================================================

import { SOCIncident } from "./SOCIncident";

export class IncidentResponseEngine{

    escalate(

        incident:SOCIncident

    ){

        incident.status="ESCALATED";

        return incident;

    }

    resolve(

        incident:SOCIncident

    ){

        incident.status="RESOLVED";

        return incident;

    }

}
