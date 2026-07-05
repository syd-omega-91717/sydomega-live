// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/telemetryStore.ts
// ============================================================================

import {create} from "zustand";

interface TelemetryState{

    values:Record<string,number>;

    update:(id:string,value:number)=>void;

}

export const useTelemetryStore=

create<TelemetryState>(

(set)=>({

values:{},

update:(id,value)=>

set(state=>({

values:{

...state.values,

[id]:value

}

}))

})

);
