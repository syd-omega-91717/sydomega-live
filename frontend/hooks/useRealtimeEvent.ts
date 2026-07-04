// ============================================================================
// FILE:
// /frontend/hooks/useRealtimeEvent.ts
// ============================================================================

import { useEffect } from "react";

import socketClient from "@/services/realtime/socketClient";

export function useRealtimeEvent<T>(

    eventType:string,

    handler:(payload:T)=>void

){

    useEffect(()=>{

        const wrapped = (event:any)=>{

            handler(event.payload);

        };

        socketClient.subscribe(eventType, wrapped);

        return ()=>{

            socketClient.unsubscribe(eventType, wrapped);

        };

    },[eventType, handler]);

}
