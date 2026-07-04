// ============================================================================
// FILE:
// /frontend/utils/gis/coordinates.ts
// ============================================================================

export class CoordinateUtils{

    static format(

        latitude:number,

        longitude:number

    ){

        return{

            latitude:latitude.toFixed(6),

            longitude:longitude.toFixed(6)

        };

    }

    static valid(

        latitude:number,

        longitude:number

    ){

        return(

            latitude>=-90 &&

            latitude<=90 &&

            longitude>=-180 &&

            longitude<=180

        );

    }

}
