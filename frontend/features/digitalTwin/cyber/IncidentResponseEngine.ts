// ============================================================================
// FILE:
// /frontend/features/digitalTwin/cyber/IncidentResponseEngine.ts
// ============================================================================

export interface ResponsePlaybook{

    id:string;

    name:string;

}

export class IncidentResponseEngine{

    execute(

        playbook:ResponsePlaybook

    ){

        return{

            playbook,

            status:"EXECUTED"

        };

    }

}
