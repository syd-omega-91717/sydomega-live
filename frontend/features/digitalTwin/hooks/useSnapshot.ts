// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useSnapshot.ts
// ============================================================================

'use client';

import {

useSnapshotStore

}

from "../store/snapshotStore";

export function useSnapshot(){

    return{

        snapshots:

        useSnapshotStore(

            s=>s.snapshots

        ),

        add:

        useSnapshotStore(

            s=>s.add

        )

    };

}
