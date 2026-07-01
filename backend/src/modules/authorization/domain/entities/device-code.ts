// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/device-code.ts
// NEW FILE
// ============================================================================

import { DeviceCodeId }
from "../value-objects/device-code-id";

import { DeviceCodeStatus }
from "../enums/device-code-status";

export class DeviceCode{

    constructor(

        readonly id:DeviceCodeId,

        readonly clientId:string,

        readonly userCode:string,

        readonly verificationUri:string,

        readonly scopes:string[],

        readonly status:DeviceCodeStatus,

        readonly expiresAt:Date

    ){}

}
