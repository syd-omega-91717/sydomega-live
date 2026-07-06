// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/GeoJsonParser.ts
// ============================================================================

export class GeoJsonParser{

    parse(

        geojson:any

    ){

        return geojson.features.map(

            (feature:any)=>({

                id:feature.id,

                geometry:feature.geometry,

                properties:feature.properties

            })

        );

    }

}
