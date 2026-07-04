// ============================================================================
// FILE:
// /frontend/services/adminService.ts
// ============================================================================

import { apiClient } from "./apiClient";

export default class AdminService{

    static async users(){

        return (await apiClient.get("/admin/users")).data;

    }

    static async organizations(){

        return (await apiClient.get("/admin/organizations")).data;

    }

    static async roles(){

        return (await apiClient.get("/admin/roles")).data;

    }

    static async createUser(user:any){

        return (await apiClient.post("/admin/users",user)).data;

    }

    static async updateUser(id:string,user:any){

        return (await apiClient.put(`/admin/users/${id}`,user)).data;

    }

    static async deleteUser(id:string){

        return (await apiClient.delete(`/admin/users/${id}`)).data;

    }

}
