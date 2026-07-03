// ============================================================================
// FILE:
// /frontend/services/apiClient.ts
// ============================================================================

import axios
from "axios";

export const apiClient=axios.create({

    baseURL:process.env.NEXT_PUBLIC_GATEWAY_URL,

    timeout:30000

});

apiClient.interceptors.request.use(

config=>{

    const token=

        localStorage.getItem("access_token");

    if(token){

        config.headers.Authorization=

            `Bearer ${token}`;

    }

    return config;

});
