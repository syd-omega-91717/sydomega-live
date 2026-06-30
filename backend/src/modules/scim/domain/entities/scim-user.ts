// ============================================================================
// FILE: /backend/src/modules/scim/domain/entities/scim-user.ts
// NEW FILE
// ============================================================================

import { ScimId } from "../value-objects/scim-id";

export class ScimUser {

    constructor(

        readonly id: ScimId,

        readonly userName: string,

        readonly active: boolean

    ) {}

}
