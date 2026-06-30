// ============================================================================
// FILE: /backend/src/modules/identity/application/services/identity-analytics.service.ts
// NEW FILE
// ============================================================================

import { IdentityDashboard }
from "../../domain/entities/identity-dashboard";

export interface IdentityAnalyticsService{

    dashboard(

        tenantId:string,

        from:Date,

        to:Date

    ):Promise<IdentityDashboard>;

}
