// ============================================================================
// FILE: /backend/src/modules/organization/infrastructure/mappers/organization.mapper.ts
// NEW FILE
// ============================================================================

import { Organization } from "../../domain/entities/organization.entity.js";

export class OrganizationMapper {

    static toPersistence(

        entity: Organization

    ) {

        return {

            id: entity.id,

            name: entity.name,

            slug: entity.slug,

            type: entity.type,

            status: entity.status,

            owner_id: entity.ownerId,

            description: entity.description,

            website: entity.website,

            logo_url: entity.logoUrl,

            created_at: entity.createdAt,

            updated_at: entity.updatedAt

        };

    }

    static toDomain(

        record: any

    ): Organization {

        return new Organization(

            record.id,

            record.name,

            record.slug,

            record.type,

            record.status,

            record.owner_id,

            record.description,

            record.website,

            record.logo_url,

            new Date(record.created_at),

            new Date(record.updated_at)

        );

    }

}
