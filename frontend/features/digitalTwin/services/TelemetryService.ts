// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/TelemetryService.ts
// ============================================================================

import {DigitalTwinSocket}

from "../network/DigitalTwinSocket";

export class TelemetryService{

    constructor(

        private socket:DigitalTwinSocket

    ){}

    subscribe(

        callback:(data:any)=>void

    ){

        this.socket.subscribe(

            "telemetry",

            callback

        );

    }

}
