// ============================================================================
// FILE: /backend/src/modules/organization/domain/value-objects/organization-id.vo.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

export class OrganizationId {

    private constructor(

        private readonly value: string

    ) {}

    public static create(

        value?: string

    ): OrganizationId {

        return new OrganizationId(

            value ?? crypto.randomUUID()

        );

    }

    public toString(): string {

        return this.value;

    }

    public equals(

        other: OrganizationId

    ): boolean {

        return this.value === other.value;

    }

}
