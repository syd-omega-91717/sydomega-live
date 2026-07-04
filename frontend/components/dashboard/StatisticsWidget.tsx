// ============================================================================
// FILE:
// /frontend/components/dashboard/StatisticsWidget.tsx
// ============================================================================

'use client';

import DashboardWidget
from "./DashboardWidget";

export default function StatisticsWidget(){

    return(

        <DashboardWidget
            title="Statistics"
        >

            <p>Users : 12,834</p>

            <p>Organizations : 842</p>

            <p>Devices : 62,102</p>

            <p>AI Requests : 3,402,113</p>

        </DashboardWidget>

    );

}
