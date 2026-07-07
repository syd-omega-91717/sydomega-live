// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/TrendAnalyzer.ts
// ============================================================================

export class TrendAnalyzer{

    direction(values:number[]){

        if(values.length<2){

            return"UNKNOWN";

        }

        return values.at(-1)!>

        values[0]

        ?"UPWARD"

        :"DOWNWARD";

    }

}
