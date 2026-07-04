// ============================================================================
// FILE:
// /frontend/hooks/useCurrentUser.ts
// ============================================================================

import {

    useAuthStore

} from "@/store/authStore";

export function useCurrentUser(){

    return useAuthStore(

        s=>s.profile

    );

}
