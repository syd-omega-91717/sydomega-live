// ============================================================================
// FILE:
// /frontend/app/page.tsx
// ============================================================================

'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage(){

    const router = useRouter();

    useEffect(()=>{

        router.push("/dashboard");

    },[]);

    return (

        <div style={{
            display:"flex",
            height:"100vh",
            alignItems:"center",
            justifyContent:"center",
            fontFamily:"system-ui"
        }}>

            Loading Ω SYD OMEGA 91717...

        </div>

    );

}
