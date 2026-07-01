// ============================================================================
// FILE: /backend/src/modules/authorization/infrastructure/repositories/device-trust.repository.ts
// NEW FILE
// ============================================================================

import { DeviceTrustAggregate }
from "../../domain/aggregates/device-trust.aggregate";

export interface DeviceTrustRepository{

    save(

        aggregate:DeviceTrustAggregate

    ):Promise<void>;

    find(

        id:string

    ):Promise<DeviceTrustAggregate|null>;

    trustedDevices(

        principalId:string

    ):Promise<DeviceTrustAggregate[]>;

}
