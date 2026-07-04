// ============================================================================
// FILE:
// /frontend/store/settingsStore.ts
// ============================================================================

import {create} from "zustand";

export const useSettingsStore=create(

(set)=>({

settings:null,

setSettings:(settings:any)=>{

set({settings});

}

})

);
