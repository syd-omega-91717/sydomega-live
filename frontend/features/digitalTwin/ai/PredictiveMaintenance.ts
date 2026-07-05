// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/PredictiveMaintenance.ts
// ============================================================================

export interface MaintenanceTask{

    assetId:string;

    priority:"LOW"|"MEDIUM"|"HIGH";

    dueInDays:number;

}

export class PredictiveMaintenance{

    recommend(

        score:number,

        assetId:string

    ):MaintenanceTask{

        return{

            assetId,

            priority:

            score>90

            ?"HIGH"

            :score>70

            ?"MEDIUM"

            :"LOW",

            dueInDays:

            Math.max(

                1,

                100-score

            )

        };

    }

}
