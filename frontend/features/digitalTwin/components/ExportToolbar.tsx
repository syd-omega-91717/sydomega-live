// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/ExportToolbar.tsx
// ============================================================================

'use client';

import EnterpriseButton

from "@/components/ui/Button";

export default function ExportToolbar(){

    return(

        <section>

            <EnterpriseButton>

                Export JSON

            </EnterpriseButton>

            <EnterpriseButton>

                Export CSV

            </EnterpriseButton>

            <EnterpriseButton>

                Export Scene

            </EnterpriseButton>

        </section>

    );

}
