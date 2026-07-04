// ============================================================================
// FILE:
// /frontend/app/ai/page.tsx
// ============================================================================

'use client';

import EnterpriseCard from "@/components/ui/Card";

export default function AIPage(){

    return(

        <main>

            <h1>Artificial Intelligence</h1>

            <EnterpriseCard title="AI Assistant">

                Enterprise AI Control Center

            </EnterpriseCard>

            <EnterpriseCard title="AI Agents">

                Active Agents: 12

            </EnterpriseCard>

            <EnterpriseCard title="Inference">

                GPU Cluster Connected

            </EnterpriseCard>

        </main>

    );

}
