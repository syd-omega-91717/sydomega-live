// ============================================================================
// FILE: /backend/src/modules/oidc/domain/value-objects/subject-id.ts
// NEW FILE
// ============================================================================

export class SubjectId {

    constructor(

        readonly value: string

    ) {

        if (!value.trim()) {

            throw new Error("Invalid subject identifier.");

        }

    }

}
