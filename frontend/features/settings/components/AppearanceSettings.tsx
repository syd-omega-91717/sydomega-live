// ============================================================================
// FILE:
// /frontend/features/settings/components/AppearanceSettings.tsx
// ============================================================================

'use client';

import EnterpriseCard
from "@/components/ui/Card";

export default function AppearanceSettings(){

    return(

        <EnterpriseCard title="Appearance">

            <select>

                <option>Dark</option>

                <option>Light</option>

                <option>System</option>

            </select>

        </EnterpriseCard>

    );

}
