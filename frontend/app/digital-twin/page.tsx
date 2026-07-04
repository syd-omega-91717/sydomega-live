// ============================================================================
// FILE:
// /frontend/app/digital-twin/page.tsx
// ============================================================================

'use client';

import TwinViewer from "@/features/digitalTwin/components/TwinViewer";

export default function TwinPage(){

    return(

        <main>

            <h1>Digital Twin</h1>

            <TwinViewer/>

        </main>

    );

}
