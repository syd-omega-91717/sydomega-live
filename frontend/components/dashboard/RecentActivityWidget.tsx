// ============================================================================
// FILE:
// /frontend/components/dashboard/RecentActivityWidget.tsx
// ============================================================================

'use client';

import DashboardWidget
from "./DashboardWidget";

export default function RecentActivityWidget(){

    return(

        <DashboardWidget
            title="Recent Activity"
        >

            <ul>

                <li>Administrator Login</li>

                <li>Workflow Executed</li>

                <li>Digital Twin Updated</li>

                <li>AI Analysis Completed</li>

            </ul>

        </DashboardWidget>

    );

}
