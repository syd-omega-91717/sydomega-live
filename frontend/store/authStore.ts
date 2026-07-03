// ============================================================================
// FILE:
// /frontend/store/authStore.ts
// ============================================================================

import { create } from "zustand";

interface AuthState{

    accessToken?:string;

    refreshToken?:string;

    setTokens:(a:string,r:string)=>void;

    clear:()=>void;

}

export const useAuthStore=create<AuthState>(

(set)=>({

    accessToken:undefined,

    refreshToken:undefined,

    setTokens:(a,r)=>set({

        accessToken:a,

        refreshToken:r

    }),

    clear:()=>set({

        accessToken:undefined,

        refreshToken:undefined

    })

})

);
