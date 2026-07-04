// ============================================================================
// FILE:
// /frontend/utils/gis/geojson.ts
// ============================================================================

export class GeoJSONUtils{

    static export(features:any[]){

        return{

            type:"FeatureCollection",

            features

        };

    }

    static import(data:any){

        if(data.type!=="FeatureCollection"){

            throw new Error("Invalid GeoJSON");

        }

        return data.features;

    }

}
