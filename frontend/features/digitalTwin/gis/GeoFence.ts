// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/GeoFence.ts
// ============================================================================

export interface Fence{

    id:string;

    minX:number;

    minY:number;

    maxX:number;

    maxY:number;

}

export class GeoFence{

    contains(

        fence:Fence,

        x:number,

        y:number

    ){

        return(

            x>=fence.minX&&

            x<=fence.maxX&&

            y>=fence.minY&&

            y<=fence.maxY

        );

    }

}
