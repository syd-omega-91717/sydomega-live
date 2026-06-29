// ============================================================================
// FILE: /backend/src/modules/organization/infrastructure/persistence/organization-read.repository.supabase.ts
// NEW FILE
// ============================================================================

import { supabase }
from "../../../../database/supabase.js";

import { OrganizationReadRepository }
from "../../domain/repositories/organization-read.repository.js";

export class SupabaseOrganizationReadRepository
implements OrganizationReadRepository {

    async overview(

        organizationId: string

    ) {

        const { data, error } =

            await supabase

                .from("organization_overview")

                .select("*")

                .eq("id", organizationId)

                .single();

        if (error)

            throw error;

        return data;

    }

    async statistics(

        organizationId: string

    ) {

        const { data, error } =

            await supabase

                .from("organization_statistics")

                .select("*")

                .eq("organization_id", organizationId)

                .single();

        if (error)

            throw error;

        return data;

    }

}
