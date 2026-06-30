// ============================================================================
// FILE: /backend/src/modules/saml/domain/value-objects/entity-id.ts
// NEW FILE
// ============================================================================

export class EntityId {

    constructor(

        readonly value: string

    ) {

        if (!value.trim()) {

            throw new Error("Invalid entity identifier.");

        }

    }

}
