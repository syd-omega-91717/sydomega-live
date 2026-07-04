// ============================================================================
// FILE:
// /frontend/app/iot/page.tsx
// ============================================================================

'use client';

import DeviceTable from "@/features/iot/components/DeviceTable";

export default function IoTPage(){

    return(

        <main>

            <h1>IoT Operations</h1>

            <DeviceTable/>

        </main>

    );

}
