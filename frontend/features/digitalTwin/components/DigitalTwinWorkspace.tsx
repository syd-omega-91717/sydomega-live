// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/DigitalTwinWorkspace.tsx
// UPDATED
// ============================================================================

'use client';

import LayerPanel from "./LayerPanel";
import ValidationPanel from "./ValidationPanel";
import AssetInspector from "./AssetInspector";

export default function DigitalTwinWorkspace(){

    return(

        <main>

            {/* Existing workspace components */}

            <LayerPanel/>

            <ValidationPanel/>

            <AssetInspector/>

        </main>

    );

}
