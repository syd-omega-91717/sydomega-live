// ============================================================================
// FILE: /backend/src/modules/organization/widgets/widget.registry.ts
// NEW FILE
// ============================================================================

import { OrganizationOverviewWidget }

from "./organization-overview.widget.js";

import { MemberActivityWidget }

from "./member-activity.widget.js";

import { OrganizationStorageWidget }

from "./storage.widget.js";

import { OrganizationSubscriptionWidget }

from "./subscription.widget.js";

export function registerOrganizationWidgets(

    registry:any

){

    registry.register(

        new OrganizationOverviewWidget()

    );

    registry.register(

        new MemberActivityWidget()

    );

    registry.register(

        new OrganizationStorageWidget()

    );

    registry.register(

        new OrganizationSubscriptionWidget()

    );

}
