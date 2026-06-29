// ============================================================================
// FILE: /backend/src/modules/organization/domain/entities/organization.entity.ts
// NEW FILE
// ============================================================================

import { OrganizationStatus } from "../enums/organization-status.enum.js";
import { OrganizationType } from "../enums/organization-type.enum.js";

export class Organization {

    constructor(

        public readonly id: string,

        public name: string,

        public slug: string,

        public type: OrganizationType,

        public status: OrganizationStatus,

        public ownerId: string,

        public description: string | null,

        public website: string | null,

        public logoUrl: string | null,

        public createdAt: Date,

        public updatedAt: Date

    ) {}

    activate() {

        this.status = OrganizationStatus.ACTIVE;

        this.updatedAt = new Date();

    }

    suspend() {

        this.status = OrganizationStatus.SUSPENDED;

        this.updatedAt = new Date();

    }

    archive() {

        this.status = OrganizationStatus.ARCHIVED;

        this.updatedAt = new Date();

    }

    rename(name: string) {

        this.name = name;

        this.updatedAt = new Date();

    }

}
