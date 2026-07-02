// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/dashboard.service.ts
// NEW FILE
// ============================================================================

import { ComplianceDashboard }
from "../../domain/entities/compliance-dashboard";

export interface DashboardService{

    compliance(

        organizationId:string

    ):Promise<ComplianceDashboard>;

    executive(

        organizationId:string

    ):Promise<ComplianceDashboard>;

}
