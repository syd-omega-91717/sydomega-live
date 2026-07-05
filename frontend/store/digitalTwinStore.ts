// ============================================================================
// FILE:
// /frontend/store/digitalTwinStore.ts
// ============================================================================

import {create} from "zustand";

export const useDigitalTwinStore=create(

(set)=>({

assets:[],

selectedAsset:null,

events:[],

setAssets:(assets:any)=>set({

assets

}),

selectAsset:(asset:any)=>set({

selectedAsset:asset

}),

setEvents:(events:any)=>set({

events

})

})

);
