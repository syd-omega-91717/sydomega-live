// ============================================================================
// FILE:
// /frontend/store/authStore.ts
// ============================================================================

import { create } from "zustand";

import { UserProfile } from "@/types/auth";

interface AuthState{

    authenticated:boolean;

    accessToken:string|null;

    profile?:UserProfile;

    login:any;

    logout:any;

}

export const useAuthStore = create<AuthState>(

(set)=>({

    authenticated:false,

    accessToken:null,

    profile:undefined,

    login:(token:string,user:UserProfile)=>{

        set({

            authenticated:true,

            accessToken:token,

            profile:user

        });

    },

    logout:()=>{

        set({

            authenticated:false,

            accessToken:null,

            profile:undefined

        });

    }

}));
