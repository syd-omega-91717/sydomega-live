// ============================================================================
// FILE:
// /frontend/services/searchService.ts
// ============================================================================

import { apiClient }
from "./apiClient";

export async function search(

    query:string

){

    const response=

        await apiClient.get(

            "/search",

            {

                params:{query}

            }

        );

    return response.data;

}
