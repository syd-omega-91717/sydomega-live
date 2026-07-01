// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/user-session.ts
// NEW FILE
// ============================================================================

import { SessionId }
from "../value-objects/session-id";

import { SessionStatus }
from "../enums/session-status";

import { SessionAuthenticationStrength }
from "../enums/session-authentication-strength";

export class UserSession{

    constructor(

        readonly id:SessionId,

        readonly principalId:string,

        readonly deviceId:string,

        readonly ipAddress:string,

        readonly authenticationStrength:SessionAuthenticationStrength,

        readonly status:SessionStatus,

        readonly createdAt:Date,

        readonly expiresAt:Date

    ){}

}
