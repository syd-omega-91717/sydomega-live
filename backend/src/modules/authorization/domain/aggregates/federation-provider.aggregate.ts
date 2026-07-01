// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/federation-provider.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { FederationProviderId }
from "../value-objects/federation-provider-id";

export class FederationProviderAggregate
extends AggregateRoot<FederationProviderId>{

    register(){}

    enable(){}

    disable(){}

    synchronize(){}

    rotateCertificates(){}

}
