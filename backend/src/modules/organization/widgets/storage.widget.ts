// ============================================================================
// FILE: /backend/src/modules/organization/widgets/storage.widget.ts
// NEW FILE
// ============================================================================

import { Widget }

from "../../../founder/widgets/widget.js";

export class OrganizationStorageWidget

implements Widget{

    readonly id="organization-storage";

    readonly name="Storage";

    readonly category="organization";

    readonly refreshInterval=917;

    async render(context:any){

        return{

            organizationId:context.organizationId,

            metric:"storage"

        };

    }

}
