// ============================================================================
// FILE:
// /frontend/components/realtime/RealtimeStatus.tsx
// ============================================================================

'use client';

import { useEffect, useState } from "react";

import socketClient from "@/services/realtime/socketClient";

export default function RealtimeStatus(){

    const [connected,setConnected] = useState(false);

    useEffect(()=>{

        const interval = setInterval(()=>{

            setConnected(

                typeof WebSocket !== "undefined"

            );

        },1000);

        return ()=>clearInterval(interval);

    },[]);

    return(

        <div>

            Status:

            {" "}

            {

                connected

                    ? "Connected"

                    : "Disconnected"

            }

        </div>

    );

}
