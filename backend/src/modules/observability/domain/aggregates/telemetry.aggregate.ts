// ============================================================================
// FILE: /backend/src/modules/observability/domain/aggregates/telemetry.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { TraceId }
from "../value-objects/trace-id";

export class TelemetryAggregate
extends AggregateRoot<TraceId>{

    startTrace(){}

    addSpan(){}

    recordMetric(){}

    exportTelemetry(){}

    finishTrace(){}

}
