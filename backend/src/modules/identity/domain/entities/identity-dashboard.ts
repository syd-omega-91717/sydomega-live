// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/identity-dashboard.ts
// NEW FILE
// ============================================================================

import { IdentityAnalyticsId }
from "../value-objects/identity-analytics-id";

import { AuthenticationMetric }
from "./authentication-metric";

import { SecurityMetric }
from "./security-metric";

export class IdentityDashboard{

    constructor(

        readonly id:IdentityAnalyticsId,

        readonly authentication:AuthenticationMetric[],

        readonly security:SecurityMetric

    ){}

}
