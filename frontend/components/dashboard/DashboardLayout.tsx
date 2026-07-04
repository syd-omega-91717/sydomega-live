// ============================================================================
// FILE:
// /frontend/components/dashboard/DashboardLayout.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface Props {

    children: ReactNode;

}

export default function DashboardLayout({

    children

}: Props) {

    return (

        <main

            style={{

                display: "grid",

                gap: 24

            }}

        >

            {children}

        </main>

    );

}
