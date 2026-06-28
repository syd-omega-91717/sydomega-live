// ============================================================================
// FILE: /backend/src/platform/context/request-context.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

export interface RequestContext {

    requestId: string;

    traceId: string;

    correlationId: string;

    sessionId?: string;

    userId?: string;

    role?: string;

    ip?: string;

    userAgent?: string;

    language?: string;

    timezone?: string;

    startedAt: Date;

}

export class RequestContextFactory {

    public create(): RequestContext {

        const id = crypto.randomUUID();

        return {

            requestId: id,

            traceId: id,

            correlationId: id,

            startedAt: new Date()

        };

    }

}

export default new RequestContextFactory();
