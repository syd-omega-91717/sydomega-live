// ============================================================================
// FILE:
// /frontend/services/http/httpClient.ts
// ============================================================================

import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse
} from "axios";

import configuration from "@/config/environment";

class HttpClient {

    private readonly client: AxiosInstance;

    constructor() {

        this.client = axios.create({

            baseURL: configuration.gatewayUrl,

            timeout: 30000,

            headers: {

                Accept: "application/json",

                "Content-Type": "application/json"

            }

        });

        this.registerInterceptors();

    }

    private registerInterceptors(): void {

        this.client.interceptors.request.use(

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

            }

        );

        this.client.interceptors.response.use(

            (response: AxiosResponse) => response,

            (error: AxiosError) => {

                return Promise.reject(error);

            }

        );

    }

    public instance(): AxiosInstance {

        return this.client;

    }

}

export default new HttpClient().instance();
