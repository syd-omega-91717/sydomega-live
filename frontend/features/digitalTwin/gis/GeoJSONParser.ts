// ============================================================================
// FILE:
// /frontend/features/digitalTwin/gis/GeoJSONParser.ts
// ============================================================================

export class GeoJSONParser{

    parse(json:string){

        return JSON.parse(json);

    }

    stringify(feature:any){

        return JSON.stringify(

            feature,

            null,

            2

        );

    }

}
