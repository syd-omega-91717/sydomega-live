// ============================================================================
// FILE:
// /frontend/features/settings/components/SecuritySettings.tsx
// ============================================================================

'use client';

import EnterpriseCard
from "@/components/ui/Card";

export default function SecuritySettings(){

    return(

        <EnterpriseCard title="Security">

            <label>

                Enable MFA

            </label>

            <input type="checkbox"/>

            <label>

                Biometric Login

            </label>

            <input type="checkbox"/>

        </EnterpriseCard>

    );

}
