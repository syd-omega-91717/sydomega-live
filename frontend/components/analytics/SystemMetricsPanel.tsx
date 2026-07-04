// ============================================================================
// FILE:
// /frontend/components/analytics/SystemMetricsPanel.tsx
// ============================================================================

'use client';

import MetricCard from "./MetricCard";
import MetricsGrid from "./MetricsGrid";

interface Props{

    cpu:number;

    memory:number;

    storage:number;

    activeUsers:number;

}

export default function SystemMetricsPanel({

    cpu,

    memory,

    storage,

    activeUsers

}:Props){

    return(

        <MetricsGrid>

            <MetricCard
                title="CPU"
                value={`${cpu}%`}
            />

            <MetricCard
                title="Memory"
                value={`${memory}%`}
            />

            <MetricCard
                title="Storage"
                value={`${storage}%`}
            />

            <MetricCard
                title="Active Users"
                value={activeUsers}
            />

        </MetricsGrid>

    );

}
