// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/SpatialIndex.ts
// ============================================================================

export interface SpatialPoint{

    id:string;

    x:number;

    y:number;

}

export class SpatialIndex{

    private readonly points=

    new Map<string,SpatialPoint>();

    insert(point:SpatialPoint){

        this.points.set(point.id,point);

    }

    remove(id:string){

        this.points.delete(id);

    }

    nearby(

        x:number,

        y:number,

        radius:number

    ){

        return [...this.points.values()]

        .filter(point=>{

            const dx=point.x-x;

            const dy=point.y-y;

            return Math.sqrt(

                dx*dx+dy*dy

            )<=radius;

        });

    }

}
