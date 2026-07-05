// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/SimulationControls.tsx
// ============================================================================

'use client';

import EnterpriseButton
from "@/components/ui/Button";

export default function SimulationControls(){

    return(

        <section>

            <EnterpriseButton>

                Start Simulation

            </EnterpriseButton>

            <EnterpriseButton>

                Pause

            </EnterpriseButton>

            <EnterpriseButton>

                Reset

            </EnterpriseButton>

        </section>

    );

}
