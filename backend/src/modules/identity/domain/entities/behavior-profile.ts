// ============================================================================
// FILE: /backend/src/modules/identity/domain/entities/behavior-profile.ts
// NEW FILE
// ============================================================================

import { BehaviorProfileId }
from "../value-objects/behavior-profile-id";

import { LoginPattern }
from "./login-pattern";

import { DevicePattern }
from "./device-pattern";

import { LocationPattern }
from "./location-pattern";

export class BehaviorProfile{

    constructor(

        readonly id:BehaviorProfileId,

        readonly userId:string,

        readonly loginPatterns:LoginPattern[],

        readonly devices:DevicePattern[],

        readonly locations:LocationPattern[]

    ){}

}
