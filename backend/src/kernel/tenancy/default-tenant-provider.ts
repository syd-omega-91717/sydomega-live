// ============================================================================
// FILE: /backend/src/kernel/tenancy/default-tenant-provider.ts
// NEW FILE
// ============================================================================

import { AsyncLocalStorage }

from "node:async_hooks";

import { TenantContext }

from "./tenant-context.js";

export class DefaultTenantProvider {

    private readonly storage =

        new AsyncLocalStorage<TenantContext>();

    run<T>(

        context: TenantContext,

        callback: () => T

    ): T {

        return this.storage.run(

            context,

            callback

        );

    }

    current(): TenantContext {

        const context =

            this.storage.getStore();

        if (!context) {

            throw new Error(

                "Tenant context unavailable."

            );

        }

        return context;

    }

}
