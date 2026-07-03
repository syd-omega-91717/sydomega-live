// ============================================================================
// FILE: /backend/src/modules/observability/application/services/telemetry.service.ts
// NEW FILE
// ============================================================================

import { Trace }
from "../../domain/entities/trace";

export interface TelemetryService{

    start(

        requestId:string

    ):Promise<Trace>;

    metric(

        name:string,

        value:number

    ):Promise<void>;

    export(

    ):Promise<void>;

}
