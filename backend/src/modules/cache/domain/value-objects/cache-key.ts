// ============================================================================
// FILE: /backend/src/modules/cache/domain/value-objects/cache-key.ts
// NEW FILE
// ============================================================================

export class CacheKey{

    constructor(

        readonly namespace:string,

        readonly key:string

    ){}

    toString():string{

        return `${this.namespace}:${this.key}`;

    }

}
