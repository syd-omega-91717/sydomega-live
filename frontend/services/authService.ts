// ============================================================================
// FILE:
// /frontend/services/authService.ts
// ============================================================================

import { apiClient } from "./apiClient";

import {

    LoginRequest,

    LoginResponse,

    RefreshResponse

} from "@/types/auth";

export default class AuthService{

    static async login(

        request:LoginRequest

    ):Promise<LoginResponse>{

        const response = await apiClient.post(

            "/auth/login",

            request

        );

        return response.data;

    }

    static async logout(){

        await apiClient.post(

            "/auth/logout"

        );

    }

    static async refresh(){

        const response = await apiClient.post<RefreshResponse>(

            "/auth/refresh"

        );

        return response.data;

    }

    static async profile(){

        const response = await apiClient.get(

            "/auth/profile"

        );

        return response.data;

    }

}
