// ============================================================================
// FILE:
// /frontend/features/digitalTwin/components/PresencePanel.tsx
// ============================================================================

'use client';

import {

useCollaborationStore

}

from "../store/collaborationStore";

export default function PresencePanel(){

    const users=

    useCollaborationStore(

        s=>s.onlineUsers

    );

    return(

        <section>

            <h3>

                Active Users

            </h3>

            <div>

                {users} Online

            </div>

        </section>

    );

}
