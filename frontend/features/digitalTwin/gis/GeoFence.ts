// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/GeoFence.ts
// ============================================================================

export interface GeoFence{

    id:string;

    minX:number;

    minY:number;

    maxX:number;

    maxY:number;

}

export class GeoFenceManager{

    contains(

        fence:GeoFence,

        x:number,

        y:number

    ){

        return(

            x>=fence.minX &&

            x<=fence.maxX &&

            y>=fence.minY &&

            y<=fence.maxY

        );

    }

}
