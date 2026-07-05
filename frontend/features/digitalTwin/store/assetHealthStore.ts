// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/assetHealthStore.ts
// ============================================================================

import {create} from "zustand";

interface State{

    health:Record<string,string>;

    setHealth:(

        id:string,

        status:string

    )=>void;

}

export const useAssetHealthStore=

create<State>((set)=>({

health:{},

setHealth:(id,status)=>

set(state=>({

health:{

...state.health,

[id]:status

}

}))

}));
