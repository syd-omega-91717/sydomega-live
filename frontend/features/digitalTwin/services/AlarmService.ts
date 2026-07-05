// ============================================================================
// FILE:
// /frontend/features/digitalTwin/services/AlarmService.ts
// ============================================================================

import {AlarmManager}

from "../engine/AlarmManager";

export class AlarmService{

    constructor(

        private manager:AlarmManager

    ){}

    process(

        assetId:string,

        value:number

    ){

        if(value>90){

            this.manager.raise({

                id:crypto.randomUUID(),

                assetId,

                severity:"CRITICAL",

                message:"Threshold exceeded",

                acknowledged:false

            });

        }

    }

}
