// ============================================================================
// FILE:
// /frontend/features/settings/components/ProfileSettings.tsx
// ============================================================================

'use client';

import EnterpriseCard
from "@/components/ui/Card";

export default function ProfileSettings(){

    return(

        <EnterpriseCard title="Profile">

            <input placeholder="First Name"/>

            <input placeholder="Last Name"/>

            <input placeholder="Email"/>

            <button>

                Save

            </button>

        </EnterpriseCard>

    );

}
