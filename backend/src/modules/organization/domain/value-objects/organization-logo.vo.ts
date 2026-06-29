// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/organization-logo.vo.ts
// NEW FILE
// ============================================================================

export class OrganizationLogo {

    constructor(

        private readonly value: string

    ) {

        if (

            !value.startsWith("http")

        ) {

            throw new Error(

                "Organization logo must be a valid URL."

            );

        }

    }

    public toString() {

        return this.value;

    }

}
