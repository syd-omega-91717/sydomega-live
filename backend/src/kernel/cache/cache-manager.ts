// ============================================================================
// FILE: /backend/src/kernel/cache/cache-manager.ts
// NEW FILE
// ============================================================================

import { CacheProvider }
from "./cache-provider.js";

export class CacheManager {

    constructor(

        private readonly provider: CacheProvider

    ) {}

    async getOrCreate<T>(

        key: string,

        factory: () => Promise<T>,

        ttl = 300

    ): Promise<T> {

        const cached =

            await this.provider.get<T>(key);

        if (cached !== null) {

            return cached;

        }

        const value =

            await factory();

        await this.provider.set(

            key,

            value,

            ttl

        );

        return value;

    }

}
