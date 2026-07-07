// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/DecisionSupportEngine.ts
// ============================================================================

export interface Recommendation{

    priority:string;

    action:string;

}

export class DecisionSupportEngine{

    recommend(

        score:number

    ):Recommendation{

        return{

            priority:

            score>0.8

            ?"HIGH"

            :"NORMAL",

            action:

            score>0.8

            ?"Immediate maintenance"

            :"Continue monitoring"

        };

    }

}
