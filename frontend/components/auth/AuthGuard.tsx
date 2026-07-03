// ============================================================================
// FILE:
// /frontend/components/auth/AuthGuard.tsx
// ============================================================================

'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {

    authenticated:boolean;

    children:React.ReactNode;

}

export default function AuthGuard({

    authenticated,

    children

}:Props){

    const router = useRouter();

    useEffect(()=>{

        if(!authenticated){

            router.replace("/login");

        }

    },[authenticated]);

    if(!authenticated){

        return null;

    }

    return <>{children}</>;

}
