// ============================================================================
// FILE:
// /frontend/providers/NotificationProvider.tsx
// ============================================================================

'use client';

import { createContext } from "react";

const NotificationContext = createContext<any>(null);

export function NotificationProvider({children}:{children:any}){

    const notify = (msg:string)=>{

        console.log("NOTIFY:",msg);

    };

    return (

        <NotificationContext.Provider value={{notify}}>

            {children}

        </NotificationContext.Provider>

    );

}
