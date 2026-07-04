// ============================================================================
// FILE:
// /frontend/components/dashboard/KpiCard.tsx
// ============================================================================

'use client';

interface Props {

    title: string;

    value: string | number;

    trend?: string;

    color?: string;

}

export default function KpiCard({

    title,

    value,

    trend,

    color = "#2563eb"

}: Props) {

    return (

        <article
            style={{
                padding: 24,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#ffffff"
            }}
        >

            <small>{title}</small>

            <h2
                style={{
                    marginTop: 10,
                    color
                }}
            >
                {value}
            </h2>

            {

                trend &&

                <p>{trend}</p>

            }

        </article>

    );

}
