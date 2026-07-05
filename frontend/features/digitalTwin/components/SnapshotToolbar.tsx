// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/SnapshotToolbar.tsx
// ============================================================================

'use client';

import EnterpriseButton

from "@/components/ui/Button";

export default function SnapshotToolbar(){

    return(

        <section>

            <EnterpriseButton>

                Capture Snapshot

            </EnterpriseButton>

            <EnterpriseButton>

                Restore Snapshot

            </EnterpriseButton>

            <EnterpriseButton>

                Export Snapshot

            </EnterpriseButton>

        </section>

    );

}
