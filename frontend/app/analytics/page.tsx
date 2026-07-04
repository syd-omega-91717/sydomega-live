// ============================================================================
// FILE:
// /frontend/app/analytics/page.tsx
// ============================================================================

'use client';

import KPIGrid from "@/features/analytics/components/KPIGrid";
import AnalyticsDashboard from "@/features/analytics/components/AnalyticsDashboard";

export default function AnalyticsPage(){

    return(

        <main>

            <h1>Enterprise Analytics</h1>

            <KPIGrid/>

            <AnalyticsDashboard/>

        </main>

    );

}
