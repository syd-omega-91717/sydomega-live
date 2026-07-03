// ============================================================================
// FILE:
// /frontend/hooks/useCurrentUser.ts
// ============================================================================

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/services/apiClient";

export function useCurrentUser(){

    return useQuery({

        queryKey:["current-user"],

        queryFn:async()=>{

            const response=

                await apiClient.get(

                    "/identity/me"

                );

            return response.data;

        }

    });

}
