// ============================================================================
// FILE: /backend/src/kernel/cache/cache-key-builder.ts
// NEW FILE
// ============================================================================

import { TenantProvider }

from "../tenancy/tenant-provider.js";

export class CacheKeyBuilder {

    constructor(

        private readonly tenant: TenantProvider

    ) {}

    build(

        area: string,

        key: string

    ): string {

        const context =

            this.tenant.current();

        return [

            context.tenantId,

            area,

            key

        ].join(":");

    }

}
