// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useAnimationFrame.ts
// ============================================================================

'use client';

import {useEffect} from "react";

export function useAnimationFrame(

    callback:(time:number)=>void

){

    useEffect(()=>{

        let frame:number;

        const animate=(time:number)=>{

            frame=requestAnimationFrame(animate);

            callback(time);

        };

        frame=requestAnimationFrame(animate);

        return()=>cancelAnimationFrame(frame);

    },[callback]);

}
