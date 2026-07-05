// ============================================================================
// FILE:
// /frontend/features/digitalTwin/hooks/useRealtimeSynchronization.ts
// ============================================================================

'use client';

import {useEffect} from "react";

import {TelemetryBuffer}

from "../network/TelemetryBuffer";

export function useRealtimeSynchronization(

    callback:(packets:any[])=>void

){

    useEffect(()=>{

        const buffer=

        new TelemetryBuffer();

        const timer=

        setInterval(()=>{

            callback(

                buffer.drain()

            );

        },100);

        return()=>{

            clearInterval(timer);

        };

    },[callback]);

}
