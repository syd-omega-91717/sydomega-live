// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/UndoRedoToolbar.tsx
// ============================================================================

'use client';

import EnterpriseButton

from "@/components/ui/Button";

export default function UndoRedoToolbar(){

    return(

        <section>

            <EnterpriseButton>

                Undo

            </EnterpriseButton>

            <EnterpriseButton>

                Redo

            </EnterpriseButton>

        </section>

    );

}
