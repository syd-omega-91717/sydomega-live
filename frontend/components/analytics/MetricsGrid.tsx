// ============================================================================
// FILE:
// /frontend/components/analytics/MetricsGrid.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface Props{

    children:ReactNode;

}

export default function MetricsGrid({

    children

}:Props){

    return(

        <section

            style={{

                display:"grid",

                gridTemplateColumns:
                    "repeat(auto-fit,minmax(250px,1fr))",

                gap:20

            }}

        >

            {children}

        </section>

    );

}
