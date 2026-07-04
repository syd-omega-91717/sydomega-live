// ============================================================================
// FILE:
// /frontend/components/dashboard/DashboardGrid.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface DashboardGridProps{
    children:ReactNode;
}

export default function DashboardGrid({
    children
}:DashboardGridProps){

    return(

        <section
            style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",
                gap:20
            }}
        >

            {children}

        </section>

    );

}
