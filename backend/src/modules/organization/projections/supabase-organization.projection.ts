// ============================================================================
// FILE: /backend/src/modules/organization/projections/supabase-organization.projection.ts
// NEW FILE
// ============================================================================

import { supabase }
from "../../../database/supabase.js";

export class SupabaseOrganizationProjection {

    async rebuildOverview(

        organizationId:string

    ){

        await supabase.rpc(

            "refresh_organization_overview",

            {

                p_organization_id:

                    organizationId

            }

        );

    }

    async rebuildStatistics(

        organizationId:string

    ){

        await supabase.rpc(

            "refresh_organization_statistics",

            {

                p_organization_id:

                    organizationId

            }

        );

    }

}
