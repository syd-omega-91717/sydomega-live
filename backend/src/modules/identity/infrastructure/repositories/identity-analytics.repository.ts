// ============================================================================
// FILE: /backend/src/modules/identity/infrastructure/repositories/identity-analytics.repository.ts
// NEW FILE
// ============================================================================

import { IdentityAnalyticsAggregate }
from "../../domain/aggregates/identity-analytics.aggregate";

export interface IdentityAnalyticsRepository{

    save(

        aggregate:IdentityAnalyticsAggregate

    ):Promise<void>;

    load(

        tenantId:string

    ):Promise<IdentityAnalyticsAggregate|null>;

}
