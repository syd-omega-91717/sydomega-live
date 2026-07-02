// ============================================================================
// FILE: /backend/src/modules/compliance/domain/aggregates/report.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ReportId }
from "../value-objects/report-id";

export class ReportAggregate
extends AggregateRoot<ReportId>{

    generate(){}

    validate(){}

    publish(){}

    archive(){}

    export(){}

}
