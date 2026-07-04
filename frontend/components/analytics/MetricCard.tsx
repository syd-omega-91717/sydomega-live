// ============================================================================
// FILE:
// /frontend/components/analytics/MetricCard.tsx
// ============================================================================

'use client';

interface MetricCardProps {

    title: string;

    value: string | number;

    description?: string;

    trend?: number;

}

export default function MetricCard({

    title,

    value,

    description,

    trend

}: MetricCardProps) {

    const trendColor =
        trend === undefined
            ? "#6b7280"
            : trend >= 0
                ? "#16a34a"
                : "#dc2626";

    return (

        <article

            style={{

                background:"#ffffff",

                border:"1px solid #e5e7eb",

                borderRadius:12,

                padding:24

            }}

        >

            <small>{title}</small>

            <h2>{value}</h2>

            {

                description &&

                <p>{description}</p>

            }

            {

                trend !== undefined &&

                <strong

                    style={{

                        color:trendColor

                    }}

                >

                    {trend >= 0 ? "+" : ""}

                    {trend}%

                </strong>

            }

        </article>

    );

}
