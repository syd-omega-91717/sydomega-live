// ============================================================================
// FILE:
// /frontend/components/dashboard/AlertWidget.tsx
// ============================================================================

'use client';

import DashboardWidget
from "./DashboardWidget";

export default function AlertWidget(){

    return(

        <DashboardWidget
            title="Active Alerts"
        >

            <ul>

                <li>No Critical Alerts</li>

                <li>2 Warning Events</li>

                <li>17 Information Events</li>

            </ul>

        </DashboardWidget>

    );

}
