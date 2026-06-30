// ============================================================================
// FILE: /backend/src/modules/identity/domain/aggregates/identity-analytics.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { IdentityAnalyticsId }
from "../value-objects/identity-analytics-id";

export class IdentityAnalyticsAggregate
extends AggregateRoot<IdentityAnalyticsId>{

    collect(){}

    summarize(){}

    publish(){}

}
