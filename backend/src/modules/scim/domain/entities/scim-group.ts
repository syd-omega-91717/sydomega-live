// ============================================================================
// FILE: /backend/src/modules/scim/domain/entities/scim-group.ts
// NEW FILE
// ============================================================================

import { ScimId } from "../value-objects/scim-id";

export class ScimGroup {

    constructor(

        readonly id: ScimId,

        readonly displayName: string

    ) {}

}
