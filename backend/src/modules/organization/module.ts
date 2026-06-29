// ============================================================================
// FILE: /backend/src/modules/organization/module.ts
// NEW FILE
// ============================================================================

import { OrganizationController }

from "./presentation/controllers/organization.controller.js";

import { organizationRoutes }

from "./presentation/routes/organization.routes.js";

export function registerOrganizationModule(

    app:any,

    controller:OrganizationController

){

    app.use(

        "/api/v1/organizations",

        organizationRoutes(

            controller

        )

    );

}
