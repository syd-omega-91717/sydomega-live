// ============================================================================
// FILE:
// /frontend/services/apiClient.ts
// ============================================================================

import axios
from "axios";

export const apiClient = axios.create({

    baseURL:process.env.NEXT_PUBLIC_API,

    timeout:30000,

    headers:{

        "Content-Type":"application/json"

    }

});

apiClient.interceptors.request.use(

    async(config)=>{

        return config;

    }

);

apiClient.interceptors.response.use(

    response=>response,

    async(error)=>{

        return Promise.reject(error);

    }

);
