// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useSceneSelection.ts
// ============================================================================

'use client';

import {

useSceneStore

}

from "../store/sceneStore";

export function useSceneSelection(){

    return{

        selected:

        useSceneStore(

            s=>s.selectedAsset

        ),

        select:

        useSceneStore(

            s=>s.setSelected

        )

    };

}
