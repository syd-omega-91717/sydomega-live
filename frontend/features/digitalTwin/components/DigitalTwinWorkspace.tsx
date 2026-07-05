// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// ============================================================================

'use client';

import CameraToolbar from "./CameraToolbar";
import TwinViewport from "./TwinViewport";
import TelemetryOverlay from "./TelemetryOverlay";
import AssetHierarchy from "./AssetHierarchy";
import AssetProperties from "./AssetProperties";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            <CameraToolbar/>

            <AssetHierarchy/>

            <TwinViewport/>

            <TelemetryOverlay/>

            <AssetProperties/>

        </main>

    );

}
