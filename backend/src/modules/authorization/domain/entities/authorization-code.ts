// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/authorization-code.ts
// NEW FILE
// ============================================================================

import { AuthorizationCodeId }
from "../value-objects/authorization-code-id";

import { AuthorizationCodeStatus }
from "../enums/authorization-code-status";

import { PkceMethod }
from "../enums/pkce-method";

export class AuthorizationCode{

    constructor(

        readonly id:AuthorizationCodeId,

        readonly clientId:string,

        readonly principalId:string,

        readonly redirectUri:string,

        readonly scopes:string[],

        readonly codeChallenge:string,

        readonly codeChallengeMethod:PkceMethod,

        readonly status:AuthorizationCodeStatus,

        readonly expiresAt:Date

    ){}

}
