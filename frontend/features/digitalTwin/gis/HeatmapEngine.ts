// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/HeatmapEngine.ts
// ============================================================================

export interface HeatPoint{

    x:number;

    y:number;

    value:number;

}

export class HeatmapEngine{

    normalize(

        points:HeatPoint[]

    ){

        const max=

        Math.max(

            ...points.map(

                p=>p.value

            )

        );

        return points.map(point=>({

            ...point,

            intensity:

            point.value/max

        }));

    }

}
