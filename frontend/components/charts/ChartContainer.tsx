// ============================================================================
// FILE:
// /frontend/components/charts/ChartContainer.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface Props {

    title?: string;

    children: ReactNode;

    height?: number;

}

export default function ChartContainer({

    title,

    children,

    height = 350

}: Props) {

    return (

        <section

            style={{

                background: "#ffffff",

                border: "1px solid #e5e7eb",

                borderRadius: 12,

                overflow: "hidden"

            }}

        >

            {

                title && (

                    <header

                        style={{

                            padding: 16,

                            borderBottom: "1px solid #e5e7eb"

                        }}

                    >

                        <h3>{title}</h3>

                    </header>

                )

            }

            <div

                style={{

                    height,

                    padding: 20

                }}

            >

                {children}

            </div>

        </section>

    );

}
