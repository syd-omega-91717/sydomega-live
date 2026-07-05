// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/aiStore.ts
// ============================================================================

import {create} from "zustand";

interface AIState{

    predictions:any[];

    anomalies:any[];

    setPredictions(

        predictions:any[]

    ):void;

    setAnomalies(

        anomalies:any[]

    ):void;

}

export const useAIStore=

create<AIState>((set)=>({

predictions:[],

anomalies:[],

setPredictions:predictions=>

set({

predictions

}),

setAnomalies:anomalies=>

set({

anomalies

})

}));
