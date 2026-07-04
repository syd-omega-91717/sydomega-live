// ============================================================================
// FILE:
// /frontend/components/dashboard/DashboardHeader.tsx
// ============================================================================

'use client';

interface Props {

    title: string;

    description?: string;

}

export default function DashboardHeader({

    title,

    description

}: Props) {

    return (

        <header>

            <h1>

                {title}

            </h1>

            {

                description &&

                <p>

                    {description}

                </p>

            }

        </header>

    );

}
