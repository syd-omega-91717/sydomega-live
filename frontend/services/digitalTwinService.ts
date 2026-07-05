// ============================================================================
// FILE:
// /frontend/services/digitalTwinService.ts
// ============================================================================

import { apiClient } from "@/services/apiClient";

export default class DigitalTwinService{

    static async assets(){

        return (await apiClient.get(

            "/digital-twin/assets"

        )).data;

    }

    static async sensors(

        assetId:string

    ){

        return (

            await apiClient.get(

                `/digital-twin/assets/${assetId}/sensors`

            )

        ).data;

    }

    static async events(){

        return (

            await apiClient.get(

                "/digital-twin/events"

            )

        ).data;

    }

}
