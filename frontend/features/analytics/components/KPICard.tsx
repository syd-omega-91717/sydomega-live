// ============================================================================
// FILE:
// /frontend/features/analytics/components/KPICard.tsx
// ============================================================================

'use client';

import { KPI } from "@/types/analytics";

export default function KPICard({

    metric

}:{

    metric:KPI

}){

    return(

        <section className="omega-kpi-card">

            <h4>{metric.title}</h4>

            <h2>

                {metric.value}

                {metric.unit}

            </h2>

            <small>

                Trend:

                {metric.trend}%

            </small>

        </section>

    );

}
