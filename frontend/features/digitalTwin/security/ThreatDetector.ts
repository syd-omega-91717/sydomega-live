// ============================================================================
// FILE:
// /frontend/features/digitalTwin/security/ThreatDetector.ts
// ============================================================================

export interface Threat{

    severity:string;

    message:string;

}

export class ThreatDetector{

    inspect(

        telemetry:any

    ):Threat[]{

        if(!telemetry){

            return[];

        }

        return[];

    }

}
