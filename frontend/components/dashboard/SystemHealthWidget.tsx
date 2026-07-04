// ============================================================================
// FILE:
// /frontend/components/dashboard/SystemHealthWidget.tsx
// ============================================================================

'use client';

import DashboardWidget
from "./DashboardWidget";

export default function SystemHealthWidget(){

    return(

        <DashboardWidget
            title="System Health"
        >

            <ul>

                <li>API Gateway : Healthy</li>

                <li>AI Cluster : Healthy</li>

                <li>PostgreSQL : Healthy</li>

                <li>Kafka : Healthy</li>

                <li>Redis : Healthy</li>

                <li>Kubernetes : Healthy</li>

            </ul>

        </DashboardWidget>

    );

}
