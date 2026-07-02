// ============================================================================
// FILE: /backend/src/modules/compliance/domain/entities/compliance-dashboard.ts
// NEW FILE
// ============================================================================

import { DashboardId }
from "../value-objects/dashboard-id";

export class ComplianceDashboard{

    constructor(

        readonly id:DashboardId,

        readonly organizationId:string,

        readonly overallCompliance:number,

        readonly totalControls:number,

        readonly compliantControls:number,

        readonly failedControls:number,

        readonly generatedAt:Date

    ){}

}
