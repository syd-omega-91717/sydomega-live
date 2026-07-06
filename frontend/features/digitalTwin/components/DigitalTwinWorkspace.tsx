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
import PhysicsSimulationDashboard
from "./PhysicsSimulationDashboard";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            {/* DT-001 → DT-019 */}

            <GISPanel/>

            <IoTDashboard/>

            <IndustrialAutomationDashboard/>

            <PhysicsSimulationDashboard/>

        </main>

    );

}
