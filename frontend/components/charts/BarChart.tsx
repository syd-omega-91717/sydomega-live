// ============================================================================
// FILE:
// /frontend/components/charts/BarChart.tsx
// ============================================================================

'use client';

import {

    ResponsiveContainer,

    BarChart,

    Bar,

    Tooltip,

    CartesianGrid,

    XAxis,

    YAxis

} from "recharts";

import ChartContainer from "./ChartContainer";

interface Props {

    title?: string;

    data: Record<string, unknown>[];

    xKey: string;

    yKey: string;

}

export default function EnterpriseBarChart({

    title,

    data,

    xKey,

    yKey

}: Props) {

    return (

        <ChartContainer title={title}>

            <ResponsiveContainer width="100%" height="100%">

                <BarChart data={data}>

                    <CartesianGrid strokeDasharray="3 3"/>

                    <XAxis dataKey={xKey}/>

                    <YAxis/>

                    <Tooltip/>

                    <Bar

                        dataKey={yKey}

                    />

                </BarChart>

            </ResponsiveContainer>

        </ChartContainer>

    );

}
