// ============================================================================
// FILE:
// /frontend/services/analyticsService.ts
// ============================================================================

import { apiClient }

from "./apiClient";

export default class AnalyticsService{

    static async dashboard(){

        const response=

            await apiClient.get(

                "/analytics/dashboard"

            );

        return response.data;

    }

    static async kpis(){

        const response=

            await apiClient.get(

                "/analytics/kpis"

            );

        return response.data;

    }

    static async trends(){

        const response=

            await apiClient.get(

                "/analytics/trends"

            );

        return response.data;

    }

}
