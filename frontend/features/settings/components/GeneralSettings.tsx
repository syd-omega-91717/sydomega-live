// ============================================================================
// FILE:
// /frontend/features/settings/components/GeneralSettings.tsx
// ============================================================================

'use client';

import EnterpriseCard
from "@/components/ui/Card";

export default function GeneralSettings(){

    return(

        <EnterpriseCard title="General">

            <label>

                Organization Name

            </label>

            <input/>

            <label>

                Default Region

            </label>

            <input/>

        </EnterpriseCard>

    );

}
