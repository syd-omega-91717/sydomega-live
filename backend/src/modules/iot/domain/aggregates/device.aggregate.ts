// ============================================================================
// FILE: /backend/src/modules/iot/domain/aggregates/device.aggregate.ts
// NEW FILE
// ============================================================================

import { AggregateRoot }
from "@/kernel/domain/aggregate-root";

import { DeviceId }
from "../value-objects/device-id";

export class DeviceAggregate
extends AggregateRoot<DeviceId>{

    provision(){}

    synchronizeShadow(){}

    ingestTelemetry(){}

    deployFirmware(){}

    retire(){}

}
