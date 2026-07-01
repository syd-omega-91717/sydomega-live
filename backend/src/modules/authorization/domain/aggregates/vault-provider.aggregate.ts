// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/vault-provider.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { VaultProviderId }
from "../value-objects/vault-provider-id";

export class VaultProviderAggregate
extends AggregateRoot<VaultProviderId>{

    register(){}

    connect(){}

    synchronize(){}

    disconnect(){}

}
