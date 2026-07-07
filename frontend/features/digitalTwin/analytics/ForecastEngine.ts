// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/ForecastEngine.ts
// ============================================================================

export class ForecastEngine{

    predict(

        values:number[]

    ){

        if(values.length===0){

            return 0;

        }

        return values.at(-1)!;

    }

}
