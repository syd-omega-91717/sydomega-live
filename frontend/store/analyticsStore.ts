// ============================================================================
// FILE:
// /frontend/store/analyticsStore.ts
// ============================================================================

import { create }

from "zustand";

export const useAnalyticsStore=

create(

(set)=>({

dashboard:null,

loading:false,

setDashboard:(dashboard:any)=>

set({

dashboard

})

})

);
