// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import PresencePanel from "./PresencePanel";
import AnnotationPanel from "./AnnotationPanel";
import VersionHistory from "./VersionHistory";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            {/* Existing Digital Twin Workspace */}

            <PresencePanel/>

            <AnnotationPanel/>

            <VersionHistory/>

        </main>

    );

}
