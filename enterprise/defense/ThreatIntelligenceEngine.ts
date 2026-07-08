// ============================================================================
// FILE:
// /enterprise/defense/ThreatIntelligenceEngine.ts
// ============================================================================

export class ThreatIntelligenceEngine{

    evaluate(

        threatId:string

    ){

        return{

            threatId,

            score:0,

            classified:true

        };

    }

}
