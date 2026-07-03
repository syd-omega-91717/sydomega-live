// ============================================================================
// FILE: /backend/src/modules/iot/domain/entities/device.ts
// NEW FILE
// ============================================================================

import { DeviceId }
from "../value-objects/device-id";

import { DeviceStatus }
from "../enums/device-status";

import { DeviceProtocol }
from "../enums/device-protocol";

export class Device{

    constructor(

        readonly id:DeviceId,

        readonly tenantId:string,

        readonly serialNumber:string,

        readonly protocol:DeviceProtocol,

        readonly status:DeviceStatus,

        readonly firmwareVersion:string

    ){}

}
