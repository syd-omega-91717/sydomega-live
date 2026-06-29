// ============================================================================
// FILE: /backend/src/kernel/tenancy/tenant-provider.ts
// NEW FILE
// ============================================================================

import { TenantContext }

from "./tenant-context.js";

export interface TenantProvider {

    current(): TenantContext;

}
