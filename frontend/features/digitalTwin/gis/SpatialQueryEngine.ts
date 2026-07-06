// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/SpatialQueryEngine.ts
// ============================================================================

export class SpatialQueryEngine{

    withinRadius(

        objects:any[],

        x:number,

        y:number,

        radius:number

    ){

        return objects.filter(object=>{

            const dx=object.x-x;

            const dy=object.y-y;

            return Math.sqrt(

                dx*dx+dy*dy

            )<=radius;

        });

    }

}
