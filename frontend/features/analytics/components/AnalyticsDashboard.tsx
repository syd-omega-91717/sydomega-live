// ============================================================================
// FILE:
// /frontend/features/analytics/components/AnalyticsDashboard.tsx
// ============================================================================

'use client';

import RequestsChart from "./RequestsChart";
import InfrastructureChart from "./InfrastructureChart";
import AIUsageChart from "./AIUsageChart";

export default function AnalyticsDashboard(){

    return(

        <section>

            <RequestsChart/>

            <InfrastructureChart/>

            <AIUsageChart/>

        </section>

    );

}
