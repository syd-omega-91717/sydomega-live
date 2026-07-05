// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/alarmStore.ts
// ============================================================================

import {create} from "zustand";

interface AlarmState{

    alarms:any[];

    setAlarms:(alarms:any[])=>void;

}

export const useAlarmStore=

create<AlarmState>((set)=>({

alarms:[],

setAlarms:(alarms)=>

set({

alarms

})

}));
