// ============================================================================
// FILE: /backend/src/modules/scim/domain/value-objects/scim-id.ts
// NEW FILE
// ============================================================================

export class ScimId {

    constructor(

        readonly value: string

    ) {

        if (!value.trim()) {

            throw new Error("Invalid SCIM identifier.");

        }

    }

}
