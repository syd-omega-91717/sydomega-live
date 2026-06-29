// ============================================================================
// FILE: /backend/src/modules/organization/infrastructure/persistence/organization.repository.supabase.ts
// NEW FILE
// ============================================================================

import { supabase }
from "../../../../database/supabase.js";

import { OrganizationRepository }
from "../../domain/repositories/organization.repository.js";

import { OrganizationAggregate }
from "../../domain/aggregates/organization.aggregate.js";

import { OrganizationMapper }
from "../mappers/organization.mapper.js";

export class SupabaseOrganizationRepository
implements OrganizationRepository {

    async findById(

        id: string

    ): Promise<OrganizationAggregate | null> {

        const { data, error } =

            await supabase

                .from("organizations")

                .select("*")

                .eq("id", id)

                .single();

        if (error)

            throw error;

        if (!data)

            return null;

        return new OrganizationAggregate(

            OrganizationMapper.toDomain(

                data

            )

        );

    }

    async findBySlug(

        slug: string

    ): Promise<OrganizationAggregate | null> {

        const { data, error } =

            await supabase

                .from("organizations")

                .select("*")

                .eq("slug", slug)

                .single();

        if (error)

            throw error;

        if (!data)

            return null;

        return new OrganizationAggregate(

            OrganizationMapper.toDomain(

                data

            )

        );

    }

    async save(

        aggregate: OrganizationAggregate

    ): Promise<void> {

        const payload =

            OrganizationMapper.toPersistence(

                aggregate.organization

            );

        const { error } =

            await supabase

                .from("organizations")

                .upsert(payload);

        if (error)

            throw error;

    }

    async delete(

        id: string

    ): Promise<void> {

        const { error } =

            await supabase

                .from("organizations")

                .delete()

                .eq("id", id);

        if (error)

            throw error;

    }

}
