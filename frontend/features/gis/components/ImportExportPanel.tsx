// ============================================================================
// FILE:
// /frontend/features/gis/components/ImportExportPanel.tsx
// ============================================================================

'use client';

import EnterpriseButton
from "@/components/ui/Button";

export default function ImportExportPanel(){

    return(

        <section>

            <EnterpriseButton>

                Import GeoJSON

            </EnterpriseButton>

            <EnterpriseButton>

                Export GeoJSON

            </EnterpriseButton>

        </section>

    );

}
