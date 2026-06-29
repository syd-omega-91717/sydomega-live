// ============================================================================
// FILE: /backend/src/modules/organization/widgets/organization-overview.widget.ts
// NEW FILE
// ============================================================================

import { Widget } from "../../../founder/widgets/widget.js";

export class OrganizationOverviewWidget implements Widget {

    readonly id = "organization-overview";

    readonly name = "Organization Overview";

    readonly category = "organization";

    readonly icon = "building";

    readonly refreshInterval = 917;

    async render(context: any) {

        return {

            title: "Organization",

            organizationId: context.organizationId,

            cards: [

                "members",

                "workspaces",

                "departments",

                "teams",

                "quota",

                "subscription"

            ]

        };

    }

}
