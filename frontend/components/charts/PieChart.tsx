// ============================================================================
// FILE:
// /frontend/components/charts/PieChart.tsx
// ============================================================================

'use client';

import {

    PieChart,

    Pie,

    Cell,

    Tooltip,

    ResponsiveContainer

} from "recharts";

import ChartContainer from "./ChartContainer";

interface Props {

    title?: string;

    data: {

        name: string;

        value: number;

        color: string;

    }[];

}

export default function EnterprisePieChart({

    title,

    data

}: Props) {

    return (

        <ChartContainer title={title}>

            <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                    <Pie

                        data={data}

                        dataKey="value"

                        nameKey="name"

                    >

                        {

                            data.map(item => (

                                <Cell

                                    key={item.name}

                                    fill={item.color}

                                />

                            ))

                        }

                    </Pie>

                    <Tooltip/>

                </PieChart>

            </ResponsiveContainer>

        </ChartContainer>

    );

}
