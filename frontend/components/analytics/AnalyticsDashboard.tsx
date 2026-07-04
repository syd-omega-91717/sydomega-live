// ============================================================================
// FILE:
// /frontend/components/analytics/AnalyticsDashboard.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface Props{

    children:ReactNode;

}

export default function AnalyticsDashboard({

    children

}:Props){

    return(

        <main

            style={{

                display:"grid",

                gap:24

            }}

        >

            {children}

        </main>

    );

}
