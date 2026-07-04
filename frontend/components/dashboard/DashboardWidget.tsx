// ============================================================================
// FILE:
// /frontend/components/dashboard/DashboardWidget.tsx
// ============================================================================

'use client';

import { ReactNode } from "react";

interface DashboardWidgetProps{

    title:string;

    children:ReactNode;

}

export default function DashboardWidget({

    title,

    children

}:DashboardWidgetProps){

    return(

        <article
            className="omega-widget"
        >

            <header>

                <h3>{title}</h3>

            </header>

            <section>

                {children}

            </section>

        </article>

    );

}
