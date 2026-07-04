// ============================================================================
// FILE:
// /frontend/components/charts/LineChart.tsx
// ============================================================================

'use client';

import {

    LineChart,

    Line,

    XAxis,

    YAxis,

    Tooltip,

    ResponsiveContainer,

    CartesianGrid

} from "recharts";

import ChartContainer from "./ChartContainer";

interface Props {

    title?: string;

    data: Record<string, unknown>[];

    xKey: string;

    yKey: string;

    color?: string;

}

export default function EnterpriseLineChart({

    title,

    data,

    xKey,

    yKey,

    color = "#2563eb"

}: Props) {

    return (

        <ChartContainer title={title}>

            <ResponsiveContainer width="100%" height="100%">

                <LineChart data={data}>

                    <CartesianGrid strokeDasharray="3 3"/>

                    <XAxis dataKey={xKey}/>

                    <YAxis/>

                    <Tooltip/>

                    <Line

                        type="monotone"

                        dataKey={yKey}

                        stroke={color}

                        strokeWidth={2}

                    />

                </LineChart>

            </ResponsiveContainer>

        </ChartContainer>

    );

}
