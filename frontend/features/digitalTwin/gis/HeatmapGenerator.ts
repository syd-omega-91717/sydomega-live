// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/HeatmapGenerator.ts
// ============================================================================

export interface HeatPoint{

    x:number;

    y:number;

    intensity:number;

}

export class HeatmapGenerator{

    generate(

        points:HeatPoint[]

    ){

        return points.map(point=>({

            ...point,

            weight:

            point.intensity/100

        }));

    }

}
