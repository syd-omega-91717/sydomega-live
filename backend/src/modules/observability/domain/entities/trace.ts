// ============================================================================
// FILE: /backend/src/modules/observability/domain/entities/trace.ts
// NEW FILE
// ============================================================================

import { TraceId }
from "../value-objects/trace-id";

export class Trace{

    constructor(

        readonly id:TraceId,

        readonly tenantId:string,

        readonly requestId:string,

        readonly service:string,

        readonly startedAt:Date,

        readonly finishedAt:Date|null

    ){}

}
