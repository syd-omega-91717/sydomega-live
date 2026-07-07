// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/TimeSeriesEngine.ts
// ============================================================================

export interface TimeSeriesPoint{

    timestamp:number;

    value:number;

}

export class TimeSeriesEngine{

    average(

        series:TimeSeriesPoint[]

    ){

        if(series.length===0){

            return 0;

        }

        return series.reduce(

            (sum,item)=>

            sum+item.value,

            0

        )/series.length;

    }

    maximum(

        series:TimeSeriesPoint[]

    ){

        return Math.max(

            ...series.map(

                s=>s.value

            )

        );

    }

}
