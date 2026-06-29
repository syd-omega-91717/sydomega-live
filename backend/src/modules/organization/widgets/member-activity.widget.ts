// ============================================================================
// FILE: /backend/src/modules/organization/widgets/member-activity.widget.ts
// NEW FILE
// ============================================================================

import { Widget } from "../../../founder/widgets/widget.js";

export class MemberActivityWidget implements Widget {

    readonly id = "organization-members";

    readonly name = "Member Activity";

    readonly category = "organization";

    readonly refreshInterval = 917;

    async render(context:any){

        return{

            organizationId:context.organizationId,

            type:"member_activity"

        };

    }

}
