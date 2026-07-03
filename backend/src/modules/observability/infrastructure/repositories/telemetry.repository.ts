// ============================================================================
// FILE: /backend/src/modules/observability/infrastructure/repositories/telemetry.repository.ts
// NEW FILE
// ============================================================================

import { TelemetryAggregate }
from "../../domain/aggregates/telemetry.aggregate";

export interface TelemetryRepository{

    save(

        aggregate:TelemetryAggregate

    ):Promise<void>;

    find(

        traceId:string

    ):Promise<TelemetryAggregate|null>;

}
