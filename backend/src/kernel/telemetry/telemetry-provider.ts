// ============================================================================
// FILE: /backend/src/kernel/telemetry/telemetry-provider.ts
// NEW FILE
// ============================================================================

import { TelemetryContext }

from "./telemetry-context.js";

export interface TelemetryProvider {

    current(): TelemetryContext;

    startSpan(

        operation: string

    ): Promise<void>;

    endSpan(): Promise<void>;

}
