// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/IndoorNavigation.ts
// ============================================================================

export interface Waypoint{

    id:string;

    x:number;

    y:number;

}

export class IndoorNavigation{

    route(

        start:Waypoint,

        destination:Waypoint

    ){

        return[

            start,

            destination

        ];

    }

}
