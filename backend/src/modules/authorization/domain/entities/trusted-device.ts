// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/trusted-device.ts
// NEW FILE
// ============================================================================

import { DeviceTrustId }
from "../value-objects/device-trust-id";

import { DeviceTrustLevel }
from "../enums/device-trust-level";

import { DevicePlatform }
from "../enums/device-platform";

export class TrustedDevice{

    constructor(

        readonly id:DeviceTrustId,

        readonly principalId:string,

        readonly fingerprint:string,

        readonly platform:DevicePlatform,

        readonly trustLevel:DeviceTrustLevel,

        readonly registeredAt:Date,

        readonly lastSeenAt:Date

    ){}

}
