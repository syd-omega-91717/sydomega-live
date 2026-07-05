// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/filterStore.ts
// ============================================================================

import {create} from "zustand";

interface FilterState{

    search:string;

    status:string;

    category:string;

    update(

        value:Partial<FilterState>

    ):void;

}

export const useFilterStore=

create<FilterState>((set)=>({

search:"",

status:"",

category:"",

update:value=>

set(state=>({

...state,

...value

}))

}));
