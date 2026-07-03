// ============================================================================
// FILE:
// /frontend/providers/AuthProvider.tsx
// ============================================================================

'use client';

import { createContext, useContext, useState } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({children}:{children:any}){

    const [user,setUser] = useState(null);

    return (

        <AuthContext.Provider value={{user,setUser}}>

            {children}

        </AuthContext.Provider>

    );

}

export function useAuth(){

    return useContext(AuthContext);

}
