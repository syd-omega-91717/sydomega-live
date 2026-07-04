// ============================================================================
// FILE:
// /frontend/components/auth/ProtectedRoute.tsx
// ============================================================================

'use client';

import {

    useEffect

} from "react";

import {

    useRouter

} from "next/navigation";

import {

    useAuthStore

} from "@/store/authStore";

export default function ProtectedRoute({

    children

}:{

    children:any

}){

    const router=useRouter();

    const authenticated=

        useAuthStore(

            s=>s.authenticated

        );

    useEffect(()=>{

        if(!authenticated){

            router.push("/login");

        }

    },[authenticated]);

    return children;

}
