// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/CameraToolbar.tsx
// ============================================================================

'use client';

import EnterpriseButton

from "@/components/ui/Button";

export default function CameraToolbar(){

    return(

        <section>

            <EnterpriseButton>

                Home

            </EnterpriseButton>

            <EnterpriseButton>

                Top

            </EnterpriseButton>

            <EnterpriseButton>

                Front

            </EnterpriseButton>

            <EnterpriseButton>

                Isometric

            </EnterpriseButton>

        </section>

    );

}
