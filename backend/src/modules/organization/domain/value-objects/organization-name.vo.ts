// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/organization-name.vo.ts
// NEW FILE
// ============================================================================

export class OrganizationName {

    constructor(

        private readonly value: string

    ) {

        const name = value.trim();

        if (name.length < 3)

            throw new Error(

                "Organization name must contain at least 3 characters."

            );

        if (name.length > 120)

            throw new Error(

                "Organization name exceeds maximum length."

            );

    }

    public toString(): string {

        return this.value.trim();

    }

}
