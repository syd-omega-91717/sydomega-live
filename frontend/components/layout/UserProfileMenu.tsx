// ============================================================================
// FILE:
// /frontend/components/layout/UserProfileMenu.tsx
// ============================================================================

'use client';

import {

    useCurrentUser

} from "@/hooks/useCurrentUser";

export default function UserProfileMenu(){

    const user=

        useCurrentUser();

    return(

        <div>

            {

                user

                ?

                user.firstName

                :

                "Guest"

            }

        </div>

    );

}
