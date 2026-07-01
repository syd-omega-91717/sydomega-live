// ============================================================================
// FILE: /backend/src/modules/authorization/domain/aggregates/device-code.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { DeviceCodeId }
from "../value-objects/device-code-id";

export class DeviceCodeAggregate
extends AggregateRoot<DeviceCodeId>{

    initiate(){}

    authorize(){}

    deny(){}

    expire(){}

}
