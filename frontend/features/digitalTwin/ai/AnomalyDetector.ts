// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/AnomalyDetector.ts
// ============================================================================

export interface Anomaly{

    assetId:string;

    score:number;

    reason:string;

}

export class AnomalyDetector{

    detect(

        telemetry:Record<string,number>

    ):Anomaly[]{

        return Object.entries(

            telemetry

        )

        .filter(

            ([,value])=>value>90

        )

        .map(([assetId,value])=>({

            assetId,

            score:value,

            reason:"Threshold exceeded"

        }));

    }

}
