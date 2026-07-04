// ============================================================================
// FILE:
// /frontend/services/settingsService.ts
// ============================================================================

import { apiClient } from "./apiClient";

export default class SettingsService{

    static async getSettings(){

        return (await apiClient.get("/settings")).data;

    }

    static async saveSettings(settings:any){

        return (await apiClient.put(

            "/settings",

            settings

        )).data;

    }

}
