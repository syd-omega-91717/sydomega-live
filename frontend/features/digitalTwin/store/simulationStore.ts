// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/simulationStore.ts
// ============================================================================

import {create} from "zustand";

interface SimulationState{

    playing:boolean;

    speed:number;

    time:number;

    play():void;

    pause():void;

    seek(time:number):void;

    setSpeed(speed:number):void;

}

export const useSimulationStore=

create<SimulationState>((set)=>({

playing:false,

speed:1,

time:0,

play:()=>set({

playing:true

}),

pause:()=>set({

playing:false

}),

seek:(time)=>set({

time

}),

setSpeed:(speed)=>set({

speed

})

}));
