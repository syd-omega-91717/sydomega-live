// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/layerStore.ts
// ============================================================================

import {create} from "zustand";

interface Layer{

    id:string;

    visible:boolean;

}

interface LayerState{

    layers:Layer[];

    toggle(id:string):void;

    set(layers:Layer[]):void;

}

export const useLayerStore=

create<LayerState>((set)=>({

layers:[],

set:layers=>set({

layers

}),

toggle:id=>

set(state=>({

layers:state.layers.map(layer=>

layer.id===id

?{

...layer,

visible:!layer.visible

}

:layer

)

}))

}));
