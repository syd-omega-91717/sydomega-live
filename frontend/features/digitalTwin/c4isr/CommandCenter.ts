// ============================================================================
// FILE:
// /frontend/features/digitalTwin/c4isr/CommandCenter.ts
// ============================================================================

import {MissionManager}

from "./MissionManager";

import {IncidentManager}

from "./IncidentManager";

export class CommandCenter{

    constructor(

        public readonly missions=

        new MissionManager(),

        public readonly incidents=

        new IncidentManager()

    ){}

    status(){

        return{

            missions:

            this.missions.all().length,

            incidents:

            this.incidents.active().length

        };

    }

}
