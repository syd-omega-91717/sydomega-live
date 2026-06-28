// ============================================================================
// FILE: /backend/src/platform/observability/tracing.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

export interface TraceContext {

    traceId: string;

    spanId: string;

    parentSpanId?: string;

}

class TracingManager {

    public create(): TraceContext {

        return {

            traceId:

                crypto.randomUUID(),

            spanId:

                crypto.randomUUID()

        };

    }

}

export default new TracingManager();
