// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import GISPanel from "./GISPanel";
import IoTDashboard from "./IoTDashboard";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            {/* DT-001 → DT-017 */}

            <GISPanel/>

            <IoTDashboard/>

        </main>

    );

}
