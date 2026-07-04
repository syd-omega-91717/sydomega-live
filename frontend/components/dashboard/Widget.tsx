// ============================================================================
// FILE:
// /frontend/components/dashboard/Widget.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

export interface WidgetProps {

    title: string;

    subtitle?: string;

    actions?: ReactNode;

    children: ReactNode;

}

export default function Widget({

    title,

    subtitle,

    actions,

    children

}: WidgetProps) {

    return (

        <section
            style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
            }}
        >

            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 20,
                    borderBottom: "1px solid #f1f5f9"
                }}
            >

                <div>

                    <h3
                        style={{
                            margin: 0,
                            fontSize: 18
                        }}
                    >
                        {title}
                    </h3>

                    {

                        subtitle &&

                        <small>

                            {subtitle}

                        </small>

                    }

                </div>

                {actions}

            </header>

            <div
                style={{
                    padding: 20
                }}
            >

                {children}

            </div>

        </section>

    );

}
