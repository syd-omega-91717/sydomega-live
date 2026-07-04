// ============================================================================
// FILE:
// /frontend/features/settings/components/LocalizationSettings.tsx
// ============================================================================

'use client';

import EnterpriseCard
from "@/components/ui/Card";

export default function LocalizationSettings(){

    return(

        <EnterpriseCard title="Localization">

            <select>

                <option>English</option>

                <option>Arabic</option>

                <option>French</option>

            </select>

        </EnterpriseCard>

    );

}
