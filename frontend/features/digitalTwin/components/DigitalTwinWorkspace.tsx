// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import GISPanel from "./GISPanel";
import IoTDashboard from "./IoTDashboard";
import IndustrialAutomationDashboard
from "./IndustrialAutomationDashboard";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            {/* DT-001 → DT-018 */}

            <GISPanel/>

            <IoTDashboard/>

            <IndustrialAutomationDashboard/>

        </main>

    );

}
