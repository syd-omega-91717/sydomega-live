// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/CoordinateTransformer.ts
// ============================================================================

export interface Coordinate{

    latitude:number;

    longitude:number;

}

export class CoordinateTransformer{

    toXY(

        coordinate:Coordinate

    ){

        return{

            x:coordinate.longitude,

            y:coordinate.latitude

        };

    }

    toLatLng(

        x:number,

        y:number

    ){

        return{

            latitude:y,

            longitude:x

        };

    }

}
