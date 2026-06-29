// ============================================================================
// FILE: /backend/src/kernel/tenancy/tenant-aware-repository.ts
// NEW FILE
// ============================================================================

import { TenantProvider }

from "./tenant-provider.js";

export abstract class TenantAwareRepository {

    protected constructor(

        protected readonly tenant:

        TenantProvider

    ) {}

    protected tenantId(): string {

        return this.tenant.current().tenantId;

    }

    protected organizationId(): string {

        return this.tenant.current().organizationId;

    }

}
