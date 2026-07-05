// ============================================================================
// FILE:
// /frontend/features/digitalTwin/store/sceneStore.ts
// ============================================================================

import {create} from "zustand";

interface SceneState{

    selectedAsset?:string;

    hoveredAsset?:string;

    setSelected(

        id?:string

    ):void;

    setHovered(

        id?:string

    ):void;

}

export const useSceneStore=

create<SceneState>(

(set)=>({

selectedAsset:undefined,

hoveredAsset:undefined,

setSelected:id=>

set({

selectedAsset:id

}),

setHovered:id=>

set({

hoveredAsset:id

})

})

);
