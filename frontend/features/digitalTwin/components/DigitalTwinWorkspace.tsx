// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import SceneBreadcrumb from "./SceneBreadcrumb";
import AssetSearchPanel from "./AssetSearchPanel";
import CameraToolbar from "./CameraToolbar";
import PlaybackToolbar from "./PlaybackToolbar";
import AlarmPanel from "./AlarmPanel";
import ConnectionStatus from "./ConnectionStatus";
import AssetHierarchy from "./AssetHierarchy";
import TwinViewport from "./TwinViewport";
import TelemetryOverlay from "./TelemetryOverlay";
import TimelineChart from "./TimelineChart";
import AssetHealthPanel from "./AssetHealthPanel";
import PerformanceMetrics from "./PerformanceMetrics";
import SceneStatistics from "./SceneStatistics";
import AssetProperties from "./AssetProperties";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            <SceneBreadcrumb/>

            <AssetSearchPanel/>

            <CameraToolbar/>

            <PlaybackToolbar/>

            <ConnectionStatus connected={true}/>

            <AssetHierarchy/>

            <TwinViewport/>

            <TelemetryOverlay/>

            <AlarmPanel/>

            <TimelineChart/>

            <AssetHealthPanel/>

            <PerformanceMetrics/>

            <SceneStatistics/>

            <AssetProperties/>

        </main>

    );

}
