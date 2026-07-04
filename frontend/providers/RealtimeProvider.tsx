// ============================================================================
// FILE:
// /frontend/providers/RealtimeProvider.tsx
// ============================================================================

'use client';

import {

    createContext,

    useContext,

    useEffect,

    ReactNode

} from "react";

import socketClient from "@/services/realtime/socketClient";

interface Props{

    children:ReactNode;

}

const RealtimeContext =
createContext(socketClient);

export default function RealtimeProvider({

    children

}:Props){

    useEffect(()=>{

        socketClient.connect();

    },[]);

    return(

        <RealtimeContext.Provider value={socketClient}>

            {children}

        </RealtimeContext.Provider>

    );

}

export function useRealtime(){

    return useContext(RealtimeContext);

}
