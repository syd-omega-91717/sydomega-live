============================================================================
FILE: /backend/src/modules/organization/domain/value-objects/organization-name.value-object.ts
STATUS: NEW FILE
DEPENDENCIES:
- None
============================================================================

  export class OrganizationName {

    constructor(

        private readonly value: string

    ) {

        const trimmed = value.trim();

        if (trimmed.length < 3) {

            throw new Error("Organization name must contain at least 3 characters.");

        }

        if (trimmed.length > 120) {

            throw new Error("Organization name cannot exceed 120 characters.");

        }

    }

    public toString(): string {

        return this.value.trim();

    }

}
