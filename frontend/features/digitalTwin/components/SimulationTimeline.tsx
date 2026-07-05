// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/SimulationTimeline.tsx
// ============================================================================

'use client';

import {

useSimulation

}

from "../hooks/useSimulation";

export default function SimulationTimeline(){

    const{

        time,

        seek

    }=useSimulation();

    return(

        <input

            type="range"

            min={0}

            max={86400}

            value={time}

            onChange={e=>

                seek(

                    Number(

                        e.target.value

                    )

                )

            }

        />

    );

}
