// ============================================================================
// FILE:
// /frontend/providers/ThemeProvider.tsx
// ============================================================================

'use client';

import { createContext, useContext, useState } from "react";

const ThemeContext = createContext<any>(null);

export function ThemeProvider({children}:{children:any}){

    const [theme,setTheme] = useState("dark");

    return (

        <ThemeContext.Provider value={{theme,setTheme}}>

            {children}

        </ThemeContext.Provider>

    );

}

export function useTheme(){

    return useContext(ThemeContext);

}
