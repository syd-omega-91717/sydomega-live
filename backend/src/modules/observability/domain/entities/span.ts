// ============================================================================
// FILE: /backend/src/modules/observability/domain/entities/span.ts
// NEW FILE
// ============================================================================

import { SpanStatus }
from "../enums/span-status";

export class Span{

    constructor(

        readonly spanId:string,

        readonly traceId:string,

        readonly operation:string,

        readonly status:SpanStatus,

        readonly duration:number

    ){}

}
