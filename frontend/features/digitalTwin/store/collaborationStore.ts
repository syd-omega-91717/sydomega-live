// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/collaborationStore.ts
// ============================================================================

import {create} from "zustand";

interface CollaborationState{

    onlineUsers:number;

    lockedAssets:string[];

    setUsers(users:number):void;

    lock(asset:string):void;

    unlock(asset:string):void;

}

export const useCollaborationStore=

create<CollaborationState>((set)=>({

onlineUsers:0,

lockedAssets:[],

setUsers:users=>

set({

onlineUsers:users

}),

lock:asset=>

set(state=>({

lockedAssets:[

...state.lockedAssets,

asset

]

})),

unlock:asset=>

set(state=>({

lockedAssets:

state.lockedAssets.filter(

a=>a!==asset

)

}))

}));
