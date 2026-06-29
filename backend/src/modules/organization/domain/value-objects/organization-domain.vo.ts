// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/organization-domain.vo.ts
// NEW FILE
// ============================================================================

export class OrganizationDomain {

    constructor(

        private readonly value: string

    ) {

        const domain =

            value.trim().toLowerCase();

        const regex =

            /^[a-z0-9.-]+\.[a-z]{2,}$/;

        if (

            !regex.test(domain)

        ) {

            throw new Error(

                "Invalid organization domain."

            );

        }

    }

    public toString() {

        return this.value.trim().toLowerCase();

    }

}
