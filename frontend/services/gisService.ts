// ============================================================================
// FILE:
// /frontend/services/gisService.ts
// ============================================================================

import {apiClient} from "@/services/apiClient";

export default class GISService{

    static async layers(){

        return (await apiClient.get("/gis/layers")).data;

    }

    static async features(layerId:string){

        return (

            await apiClient.get(

                `/gis/layers/${layerId}/features`

            )

        ).data;

    }

    static async geofences(){

        return (

            await apiClient.get("/gis/geofences")

        ).data;

    }

    static async search(query:string){

        return (

            await apiClient.get(

                "/gis/search",

                {

                    params:{query}

                }

            )

        ).data;

    }

}
