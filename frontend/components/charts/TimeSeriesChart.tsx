// ============================================================================
// FILE:
// /frontend/components/charts/TimeSeriesChart.tsx
// ============================================================================

'use client';

import EnterpriseLineChart from "./LineChart";

interface TimeSeriesChartProps {

    title?: string;

    data: {

        timestamp: string;

        value: number;

    }[];

    color?: string;

}

export default function TimeSeriesChart({

    title,

    data,

    color = "#2563eb"

}: TimeSeriesChartProps) {

    return (

        <EnterpriseLineChart

            title={title}

            data={data}

            xKey="timestamp"

            yKey="value"

            color={color}

        />

    );

}
