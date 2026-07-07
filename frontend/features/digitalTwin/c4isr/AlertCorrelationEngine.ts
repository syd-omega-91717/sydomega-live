// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/AlertCorrelationEngine.ts
// ============================================================================

export interface Alert{

    id:string;

    type:string;

    source:string;

}

export class AlertCorrelationEngine{

    correlate(

        alerts:Alert[]

    ){

        return{

            total:alerts.length,

            correlated:

            alerts.length>1

        };

    }

}
