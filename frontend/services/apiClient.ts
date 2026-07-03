// ============================================================================
// FILE:
// /frontend/services/apiClient.ts
// ============================================================================

import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse
} from "axios";

const apiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json"
    }
});

apiClient.interceptors.request.use(
    (config: AxiosRequestConfig): AxiosRequestConfig => {

        if (typeof window !== "undefined") {

            const token = localStorage.getItem("access_token");

            if (token) {

                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${token}`
                };

            }

        }

        return config;

    },
    (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(

    (response: AxiosResponse) => response,

    async (error: AxiosError) => {

        if (error.response?.status === 401) {

            // Future:
            // Refresh JWT
            // Retry request

        }

        return Promise.reject(error);

    }

);

export default apiClient;

export { apiClient };
