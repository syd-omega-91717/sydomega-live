// ============================================================================
// FILE:
// /enterprise/smart-city/TrafficManagementEngine.ts
// ============================================================================

import { TrafficIncident } from "./TrafficIncident";

export class TrafficManagementEngine{

    dispatch(

        incident:TrafficIncident

    ){

        return{

            incident,

            routed:true

        };

    }

}
