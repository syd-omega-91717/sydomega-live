// ============================================================================
// FILE:
// /frontend/components/charts/TimeSeriesChart.tsx
// ============================================================================

'use client';

import EnterpriseLineChart

from "./LineChart";

interface Props {

    title?: string;

    data: {

        timestamp: string;

        value: number;

    }[];

}

export default function TimeSeriesChart({

    title,

    data

}: Props) {

    return (

        <EnterpriseLineChart

            title={title}

            data={data}

            xKey="timestamp"

            yKey="value"

        />

    );

}
