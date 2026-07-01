// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/device-trust.service.ts
// NEW FILE
// ============================================================================

import { TrustedDevice }
from "../../domain/entities/trusted-device";

export interface DeviceTrustService{

    register(

        principalId:string,

        fingerprint:string

    ):Promise<TrustedDevice>;

    verify(

        deviceId:string

    ):Promise<boolean>;

}
