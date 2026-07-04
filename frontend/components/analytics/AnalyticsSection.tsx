// ============================================================================
// FILE:
// /frontend/components/analytics/AnalyticsSection.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface Props{

    title:string;

    children:ReactNode;

}

export default function AnalyticsSection({

    title,

    children

}:Props){

    return(

        <section

            style={{

                display:"flex",

                flexDirection:"column",

                gap:20

            }}

        >

            <h2>{title}</h2>

            {children}

        </section>

    );

}
