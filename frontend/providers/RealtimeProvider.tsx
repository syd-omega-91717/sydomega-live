// ============================================================================
// FILE:
// /frontend/providers/RealtimeProvider.tsx
// ============================================================================

'use client';

import { createContext } from "react";

const RealtimeContext = createContext<any>(null);

export function RealtimeProvider({children}:{children:any}){

    const connect = ()=>{};

    const disconnect = ()=>{};

    return (

        <RealtimeContext.Provider value={{connect,disconnect}}>

            {children}

        </RealtimeContext.Provider>

    );

}
