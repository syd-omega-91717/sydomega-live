// ============================================================================
// FILE: /backend/src/modules/organization/domain/factories/organization.factory.ts
// NEW FILE
// ============================================================================

import crypto from "node:crypto";

import { Organization } from "../entities/organization.entity.js";
import { OrganizationAggregate } from "../aggregates/organization.aggregate.js";

import { OrganizationStatus } from "../enums/organization-status.enum.js";
import { OrganizationType } from "../enums/organization-type.enum.js";

export interface CreateOrganizationOptions {

    ownerId: string;

    name: string;

    slug: string;

    type?: OrganizationType;

    description?: string;

    website?: string;

    logoUrl?: string;

}

export class OrganizationFactory {

    static create(

        options: CreateOrganizationOptions

    ): OrganizationAggregate {

        const now = new Date();

        const organization = new Organization(

            crypto.randomUUID(),

            options.name,

            options.slug,

            options.type ?? OrganizationType.COMPANY,

            OrganizationStatus.ACTIVE,

            options.ownerId,

            options.description ?? null,

            options.website ?? null,

            options.logoUrl ?? null,

            now,

            now

        );

        return OrganizationAggregate.create(

            organization

        );

    }

}
