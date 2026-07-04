// ============================================================================
// FILE:
// /frontend/features/settings/components/APIKeySettings.tsx
// ============================================================================

'use client';

import EnterpriseCard
from "@/components/ui/Card";

export default function APIKeySettings(){

    return(

        <EnterpriseCard title="API Keys">

            <button>

                Generate API Key

            </button>

            <button>

                Revoke All

            </button>

        </EnterpriseCard>

    );

}
