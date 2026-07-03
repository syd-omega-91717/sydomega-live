// ============================================================================
// FILE: /backend/src/modules/api-gateway/domain/enums/rate-limit-policy.ts
// NEW FILE
// ============================================================================

export enum RateLimitPolicy{

    FixedWindow="FIXED_WINDOW",

    SlidingWindow="SLIDING_WINDOW",

    TokenBucket="TOKEN_BUCKET",

    LeakyBucket="LEAKY_BUCKET"

}
