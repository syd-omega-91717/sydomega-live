// ============================================================================
// FILE:
// /frontend/components/auth/PermissionGuard.tsx
// ============================================================================

'use client';

import {

    useAuthStore

}

from "@/store/authStore";

export default function PermissionGuard({

    permission,

    children

}:{

    permission:string;

    children:any;

}){

    const profile=

        useAuthStore(

            s=>s.profile

        );

    if(

        !profile

    ){

        return null;

    }

    if(

        !profile.permissions.includes(

            permission

        )

    ){

        return null;

    }

    return children;

}
