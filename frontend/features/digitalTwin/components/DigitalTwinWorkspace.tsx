// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import CameraToolbar from "./CameraToolbar";
import TwinViewport from "./TwinViewport";
import AssetHierarchy from "./AssetHierarchy";
import AssetProperties from "./AssetProperties";
import TelemetryOverlay from "./TelemetryOverlay";
import PerformanceOverlay from "./PerformanceOverlay";
import SceneStatistics from "./SceneStatistics";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            <CameraToolbar/>

            <AssetHierarchy/>

            <TwinViewport/>

            <TelemetryOverlay/>

            <PerformanceOverlay/>

            <SceneStatistics/>

            <AssetProperties/>

        </main>

    );

}
