// ============================================================================
// FILE:
// /frontend/features/digitalTwin/ai/AssetRiskEngine.ts
// ============================================================================

export interface RiskAssessment{

    assetId:string;

    score:number;

    level:string;

}

export class AssetRiskEngine{

    evaluate(

        assetId:string,

        probability:number

    ):RiskAssessment{

        return{

            assetId,

            score:probability,

            level:

            probability>.8

            ?"CRITICAL"

            :probability>.5

            ?"WARNING"

            :"NORMAL"

        };

    }

}
