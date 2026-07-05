// ============================================================================
// FILE:
// /frontend/app/digital-twin/page.tsx
// UPDATED
// ============================================================================

'use client';

import TwinViewport from "@/features/digitalTwin/components/TwinViewport";
import AssetHierarchy from "@/features/digitalTwin/components/AssetHierarchy";
import SensorPanel from "@/features/digitalTwin/components/SensorPanel";
import EventTimeline from "@/features/digitalTwin/components/EventTimeline";
import SimulationControls from "@/features/digitalTwin/components/SimulationControls";
import TelemetryOverlay from "@/features/digitalTwin/components/TelemetryOverlay";

export default function DigitalTwinPage(){

    return(

        <main>

            <h1>Enterprise Digital Twin</h1>

            <SimulationControls/>

            <AssetHierarchy/>

            <TwinViewport/>

            <TelemetryOverlay/>

            <SensorPanel/>

            <EventTimeline/>

        </main>

    );

}
