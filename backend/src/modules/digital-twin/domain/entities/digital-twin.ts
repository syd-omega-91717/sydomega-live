// ============================================================================
// FILE: /backend/src/modules/digital-twin/domain/entities/digital-twin.ts
// NEW FILE
// ============================================================================

import { TwinId }
from "../value-objects/twin-id";

import { TwinStatus }
from "../enums/twin-status";

import { TwinType }
from "../enums/twin-type";

export class DigitalTwin{

    constructor(

        readonly id:TwinId,

        readonly name:string,

        readonly type:TwinType,

        readonly tenantId:string,

        readonly status:TwinStatus,

        readonly metadata:Record<string,unknown>

    ){}

}
