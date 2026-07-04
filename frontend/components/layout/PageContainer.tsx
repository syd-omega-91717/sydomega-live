// ============================================================================
// FILE:
// /frontend/components/layout/PageContainer.tsx
// ============================================================================

import { ReactNode } from "react";

interface Props {

    title: string;

    children: ReactNode;

}

export default function PageContainer({

    title,

    children

}: Props) {

    return (

        <section
            style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 24
            }}
        >

            <header>

                <h1>{title}</h1>

            </header>

            {children}

        </section>

    );

}
