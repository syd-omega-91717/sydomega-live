// ============================================================================
// FILE:
// /frontend/store/gisStore.ts
// ============================================================================

import {create} from "zustand";

export const useGISStore=create(

(set)=>({

layers:[],

selectedLayer:null,

selectedFeature:null,

setLayers:(layers:any)=>set({

layers

}),

selectLayer:(layer:any)=>set({

selectedLayer:layer

}),

selectFeature:(feature:any)=>set({

selectedFeature:feature

})

})

);
