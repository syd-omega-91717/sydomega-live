// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/TelemetryOverlay.tsx
// ============================================================================

'use client';

import {useTelemetry}

from "../hooks/useTelemetry";

import {useTelemetryStore}

from "../store/telemetryStore";

export default function TelemetryOverlay(){

    useTelemetry();

    const values=

    useTelemetryStore(

        s=>s.values

    );

    return(

        <aside>

            <h3>

                Live Telemetry

            </h3>

            {

                Object.entries(values)

                .map(([id,value])=>(

                    <div key={id}>

                        {id}: {value}

                    </div>

                ))

            }

        </aside>

    );

}
