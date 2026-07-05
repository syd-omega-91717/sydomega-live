// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/PlaybackToolbar.tsx
// ============================================================================

'use client';

import EnterpriseButton

from "@/components/ui/Button";

export default function PlaybackToolbar(){

    return(

        <section>

            <EnterpriseButton>

                Play

            </EnterpriseButton>

            <EnterpriseButton>

                Pause

            </EnterpriseButton>

            <EnterpriseButton>

                Stop

            </EnterpriseButton>

            <EnterpriseButton>

                2×

            </EnterpriseButton>

        </section>

    );

}
