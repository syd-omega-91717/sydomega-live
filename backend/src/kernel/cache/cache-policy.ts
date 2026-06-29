// ============================================================================
// FILE: /backend/src/kernel/cache/cache-policy.ts
// NEW FILE
// ============================================================================

export interface CachePolicy {

    ttlSeconds: number;

    slidingExpiration?: boolean;

    tags?: readonly string[];

}
