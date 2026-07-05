// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import CollaborationDashboard from "./CollaborationDashboard";
import AIPredictionPanel from "./AIPredictionPanel";
import AnomalyPanel from "./AnomalyPanel";
import MaintenancePlanner from "./MaintenancePlanner";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            {/* Previous DT-001 → DT-015 workspace */}

            <CollaborationDashboard/>

            <AIPredictionPanel/>

            <AnomalyPanel/>

            <MaintenancePlanner/>

        </main>

    );

}
