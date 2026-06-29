// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/organization-slug.vo.ts
// NEW FILE
// ============================================================================

export class OrganizationSlug {

    private readonly slug: string;

    constructor(

        value: string

    ) {

        const slug = value

            .trim()

            .toLowerCase()

            .replace(/\s+/g, "-");

        if (

            !/^[a-z0-9-]+$/.test(slug)

        ) {

            throw new Error(

                "Invalid organization slug."

            );

        }

        this.slug = slug;

    }

    public toString() {

        return this.slug;

    }

}
