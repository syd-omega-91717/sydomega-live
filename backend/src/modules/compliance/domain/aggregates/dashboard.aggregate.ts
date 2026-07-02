// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/dashboard.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { DashboardId }
from "../value-objects/dashboard-id";

export class DashboardAggregate
extends AggregateRoot<DashboardId>{

    generate(){}

    refresh(){}

    calculateKPIs(){}

    buildHeatmaps(){}

    publish(){}

}
