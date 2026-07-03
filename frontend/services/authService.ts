// ============================================================================
// FILE:
// /frontend/services/authService.ts
// ============================================================================

import { apiClient } from "./apiClient";

export class AuthService{

    async login(

        email:string,

        password:string

    ){

        return apiClient.post(

            "/identity/login",

            {

                email,

                password

            }

        );

    }

    async logout(){

        return apiClient.post(

            "/identity/logout"

        );

    }

    async refresh(){

        return apiClient.post(

            "/identity/refresh"

        );

    }

}

export default new AuthService();
