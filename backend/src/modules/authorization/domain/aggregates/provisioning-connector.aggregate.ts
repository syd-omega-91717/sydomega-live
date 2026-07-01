// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/provisioning-connector.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { ProvisioningConnectorId }
from "../value-objects/provisioning-connector-id";

export class ProvisioningConnectorAggregate
extends AggregateRoot<ProvisioningConnectorId>{

    register(){}

    enable(){}

    disable(){}

    heartbeat(){}

    synchronize(){}

}
