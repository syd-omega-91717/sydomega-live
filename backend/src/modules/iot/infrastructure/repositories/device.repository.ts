// ============================================================================
// FILE: /backend/src/modules/iot/infrastructure/repositories/device.repository.ts
// NEW FILE
// ============================================================================

import { DeviceAggregate }
from "../../domain/aggregates/device.aggregate";

export interface DeviceRepository{

    save(

        aggregate:DeviceAggregate

    ):Promise<void>;

}
