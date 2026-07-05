// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/AlarmManager.ts
// ============================================================================

export interface Alarm{

    id:string;

    assetId:string;

    severity:"INFO"|"WARNING"|"CRITICAL";

    message:string;

    acknowledged:boolean;

}

export class AlarmManager{

    private alarms=

    new Map<string,Alarm>();

    raise(alarm:Alarm){

        this.alarms.set(

            alarm.id,

            alarm

        );

    }

    acknowledge(id:string){

        const alarm=

        this.alarms.get(id);

        if(alarm){

            alarm.acknowledged=true;

        }

    }

    active(){

        return [...this.alarms.values()];

    }

}
