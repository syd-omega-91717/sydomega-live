// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/SimulationControlPanel.tsx
// ============================================================================

'use client';

import EnterpriseButton

from "@/components/ui/Button";

import {

useSimulation

}

from "../hooks/useSimulation";

export default function SimulationControlPanel(){

    const{

        play,

        pause,

        setSpeed

    }=useSimulation();

    return(

        <section>

            <EnterpriseButton

                onClick={play}

            >

                Play

            </EnterpriseButton>

            <EnterpriseButton

                onClick={pause}

            >

                Pause

            </EnterpriseButton>

            <select

                onChange={e=>

                    setSpeed(

                        Number(

                            e.target.value

                        )

                    )

                }

            >

                <option value={1}>1x</option>

                <option value={2}>2x</option>

                <option value={5}>5x</option>

                <option value={10}>10x</option>

            </select>

        </section>

    );

}
