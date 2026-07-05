// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/snapshotStore.ts
// ============================================================================

import {create} from "zustand";

import {Snapshot}

from "../engine/SceneSnapshot";

interface SnapshotState{

    snapshots:Snapshot[];

    add(snapshot:Snapshot):void;

}

export const useSnapshotStore=

create<SnapshotState>((set)=>({

snapshots:[],

add:(snapshot)=>

set(state=>({

snapshots:[

...state.snapshots,

snapshot

]

}))

}));
