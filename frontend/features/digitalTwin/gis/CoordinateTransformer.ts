// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/CoordinateTransformer.ts
// ============================================================================

export class CoordinateTransformer{

    wgs84ToWebMercator(

        longitude:number,

        latitude:number

    ){

        const x=

        longitude*20037508.34/180;

        let y=

        Math.log(

            Math.tan(

                (90+latitude)*Math.PI/360

            )

        )/(Math.PI/180);

        y=y*20037508.34/180;

        return{

            x,

            y

        };

    }

}
