// ============================================================================
// FILE: /backend/src/modules/oidc/domain/entities/user-info.ts
// NEW FILE
// ============================================================================

import { Claims } from "../value-objects/claims";

export class UserInfo {

    constructor(

        readonly claims: Claims

    ) {}

}
