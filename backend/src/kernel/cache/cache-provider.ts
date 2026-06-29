// ============================================================================
// FILE: /backend/src/kernel/cache/cache-provider.ts
// NEW FILE
// ============================================================================

export interface CacheProvider {

    get<T>(key: string): Promise<T | null>;

    set<T>(
        key: string,
        value: T,
        ttlSeconds?: number
    ): Promise<void>;

    delete(
        key: string
    ): Promise<void>;

    exists(
        key: string
    ): Promise<boolean>;

}
