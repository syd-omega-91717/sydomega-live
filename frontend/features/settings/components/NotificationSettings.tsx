// ============================================================================
// FILE:
// /frontend/features/settings/components/NotificationSettings.tsx
// ============================================================================

'use client';

import EnterpriseCard
from "@/components/ui/Card";

export default function NotificationSettings(){

    return(

        <EnterpriseCard title="Notifications">

            <label>

                Email Notifications

            </label>

            <input type="checkbox"/>

            <label>

                Push Notifications

            </label>

            <input type="checkbox"/>

        </EnterpriseCard>

    );

}
