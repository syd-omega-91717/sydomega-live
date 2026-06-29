// ============================================================================
// FILE: /backend/src/modules/organization/widgets/subscription.widget.ts
// NEW FILE
// ============================================================================

import { Widget }

from "../../../founder/widgets/widget.js";

export class OrganizationSubscriptionWidget

implements Widget{

    readonly id="organization-subscription";

    readonly name="Subscription";

    readonly category="organization";

    readonly refreshInterval=917;

    async render(context:any){

        return{

            organizationId:context.organizationId,

            metric:"subscription"

        };

    }

}
