// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import CameraToolbar from "./CameraToolbar";
import TwinViewport from "./TwinViewport";
import AssetHierarchy from "./AssetHierarchy";
import TelemetryOverlay from "./TelemetryOverlay";
import PerformanceOverlay from "./PerformanceOverlay";
import SceneStatistics from "./SceneStatistics";
import AssetProperties from "./AssetProperties";
import ConnectionStatus from "./ConnectionStatus";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            <CameraToolbar/>

            <ConnectionStatus

                connected={true}

            />

            <AssetHierarchy/>

            <TwinViewport/>

            <TelemetryOverlay/>

            <PerformanceOverlay/>

            <SceneStatistics/>

            <AssetProperties/>

        </main>

    );

}
