// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useSimulation.ts
// ============================================================================

'use client';

import {

useSimulationStore

}

from "../store/simulationStore";

export function useSimulation(){

    return{

        playing:

        useSimulationStore(

            s=>s.playing

        ),

        speed:

        useSimulationStore(

            s=>s.speed

        ),

        time:

        useSimulationStore(

            s=>s.time

        ),

        play:

        useSimulationStore(

            s=>s.play

        ),

        pause:

        useSimulationStore(

            s=>s.pause

        ),

        seek:

        useSimulationStore(

            s=>s.seek

        ),

        setSpeed:

        useSimulationStore(

            s=>s.setSpeed

        )

    };

}
