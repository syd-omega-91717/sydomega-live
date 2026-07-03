// ============================================================================
// FILE: /backend/src/modules/cache/domain/entities/cache-entry.ts
// NEW FILE
// ============================================================================

import { CacheKey }
from "../value-objects/cache-key";

export class CacheEntry{

    constructor(

        readonly key:CacheKey,

        readonly value:unknown,

        readonly ttl:number,

        readonly createdAt:Date

    ){}

}
