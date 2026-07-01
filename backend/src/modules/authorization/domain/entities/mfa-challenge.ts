// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/mfa-challenge.ts
// NEW FILE
// ============================================================================

import { MfaMethod }
from "../enums/mfa-method";

export class MfaChallenge{

    constructor(

        readonly challengeId:string,

        readonly principalId:string,

        readonly method:MfaMethod,

        readonly expiresAt:Date,

        readonly completed:boolean

    ){}

}
