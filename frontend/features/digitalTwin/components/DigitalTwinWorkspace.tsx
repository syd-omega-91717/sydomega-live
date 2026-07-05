// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import SceneBreadcrumb from "./SceneBreadcrumb";
import AssetSearchPanel from "./AssetSearchPanel";
import CameraToolbar from "./CameraToolbar";
import SnapshotToolbar from "./SnapshotToolbar";
import PlaybackToolbar from "./PlaybackToolbar";
import ConnectionStatus from "./ConnectionStatus";
import AssetHierarchy from "./AssetHierarchy";
import TwinViewport from "./TwinViewport";
import TelemetryOverlay from "./TelemetryOverlay";
import AlarmPanel from "./AlarmPanel";
import TimelineChart from "./TimelineChart";
import SnapshotHistory from "./SnapshotHistory";
import MeasurementPanel from "./MeasurementPanel";
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

            <SnapshotToolbar/>

            <PlaybackToolbar/>

            <ConnectionStatus connected={true}/>

            <AssetHierarchy/>

            <TwinViewport/>

            <TelemetryOverlay/>

            <AlarmPanel/>

            <TimelineChart/>

            <SnapshotHistory/>

            <MeasurementPanel/>

            <AssetHealthPanel/>

            <PerformanceMetrics/>

            <SceneStatistics/>

            <AssetProperties/>

        </main>

    );

}
