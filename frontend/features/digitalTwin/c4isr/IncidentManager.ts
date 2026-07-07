// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/IncidentManager.ts
// ============================================================================

export interface Incident{

    id:string;

    title:string;

    severity:
        |"LOW"
        |"MEDIUM"
        |"HIGH"
        |"CRITICAL";

    status:string;

}

export class IncidentManager{

    private incidents:Incident[]=[];

    report(

        incident:Incident

    ){

        this.incidents.push(

            incident

        );

    }

    active(){

        return this.incidents.filter(

            incident=>

            incident.status!=="CLOSED"

        );

    }

}
