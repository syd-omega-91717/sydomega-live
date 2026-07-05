// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useDigitalTwin.ts
// ============================================================================

'use client';

import {useEffect,useRef} from "react";
import {Engine} from "../engine/Engine";

export function useDigitalTwin(){

    const ref=

    useRef<HTMLDivElement>(null);

    useEffect(()=>{

        if(!ref.current) return;

        const engine=

        new Engine(ref.current);

        engine.start();

        return()=>engine.dispose();

    },[]);

    return ref;

}
