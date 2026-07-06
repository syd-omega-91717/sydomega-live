// ============================================================================
// FILE:
// /frontend/features/digitalTwin/industrial/AlarmEventServer.ts
// ============================================================================

export interface IndustrialAlarm{

    id:string;

    severity:string;

    message:string;

    timestamp:number;

}

export class AlarmEventServer{

    private alarms:IndustrialAlarm[]=[];

    raise(

        alarm:IndustrialAlarm

    ){

        this.alarms.push(alarm);

    }

    active(){

        return this.alarms;

    }

}
