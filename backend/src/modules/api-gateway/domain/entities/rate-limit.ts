// ============================================================================
// FILE: /backend/src/modules/api-gateway/domain/entities/rate-limit.ts
// NEW FILE
// ============================================================================

import { RateLimitPolicy }
from "../enums/rate-limit-policy";

export class RateLimit{

    constructor(

        readonly policy:RateLimitPolicy,

        readonly requests:number,

        readonly intervalSeconds:number,

        readonly burst:number

    ){}

}
