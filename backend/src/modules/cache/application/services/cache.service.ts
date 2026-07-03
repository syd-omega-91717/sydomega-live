// ============================================================================
// FILE: /backend/src/modules/cache/application/services/cache.service.ts
// NEW FILE
// ============================================================================

export interface CacheService{

    put():Promise<void>;

    get():Promise<unknown>;

    invalidate():Promise<void>;

    acquireLock():Promise<void>;

}
