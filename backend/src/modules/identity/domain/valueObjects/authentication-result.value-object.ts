// ============================================================================
// FILE: /backend/src/modules/identity/domain/valueObjects/authentication-result.value-object.ts
// NEW FILE
// ============================================================================

import { Identity } from "../entities/identity.entity.js";

export class AuthenticationResult {

    constructor(

        public readonly identity: Identity,

        public readonly authenticated: boolean,

        public readonly requiresMfa: boolean,

        public readonly requiresApproval: boolean,

        public readonly requiresPasswordReset: boolean

    ) {}

}
