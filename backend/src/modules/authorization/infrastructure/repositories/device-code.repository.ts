// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/device-code.repository.ts
// NEW FILE
// ============================================================================

import { DeviceCodeAggregate }
from "../../domain/aggregates/device-code.aggregate";

export interface DeviceCodeRepository{

    save(

        aggregate:DeviceCodeAggregate

    ):Promise<void>;

    findByUserCode(

        userCode:string

    ):Promise<DeviceCodeAggregate|null>;

}
