// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useSceneResize.ts
// ============================================================================

'use client';

import {useEffect} from "react";

export function useSceneResize(

    resize:()=>void

){

    useEffect(()=>{

        window.addEventListener(

            "resize",

            resize

        );

        return()=>{

            window.removeEventListener(

                "resize",

                resize

            );

        };

    },[resize]);

}
