// ============================================================================
// FILE:
// /enterprise/core/EnterpriseCoreRuntime.ts
// ============================================================================

import { EnterpriseAuditEngine } from "./EnterpriseAuditEngine";
import { EnterpriseConnectionEngine } from "./EnterpriseConnectionEngine";
import { EnterpriseConnectorRegistry } from "./EnterpriseConnectorRegistry";
import { EnterpriseHealthEngine } from "./EnterpriseHealthEngine";
import { EnterpriseSynchronizationEngine } from "./EnterpriseSynchronizationEngine";

export class EnterpriseCoreRuntime{

    readonly registry=

    new EnterpriseConnectorRegistry();

    readonly connection=

    new EnterpriseConnectionEngine();

    readonly synchronization=

    new EnterpriseSynchronizationEngine();

    readonly health=

    new EnterpriseHealthEngine();

    readonly audit=

    new EnterpriseAuditEngine();

}
