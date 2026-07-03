// ============================================================================
// FILE: /backend/src/modules/zero-trust/domain/entities/device-trust.ts
// NEW FILE
// ============================================================================

import { DeviceStatus }
from "../enums/device-status";

export class DeviceTrust{

    constructor(

        readonly deviceId:string,

        readonly owner:string,

        readonly status:DeviceStatus,

        readonly lastVerification:Date

    ){}

}
