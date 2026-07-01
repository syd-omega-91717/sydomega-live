// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/device-trust.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { DeviceTrustId }
from "../value-objects/device-trust-id";

export class DeviceTrustAggregate
extends AggregateRoot<DeviceTrustId>{

    register(){}

    verify(){}

    elevateTrust(){}

    revokeTrust(){}

    block(){}

}
