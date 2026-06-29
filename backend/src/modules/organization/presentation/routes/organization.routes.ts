// ============================================================================
// FILE: /backend/src/modules/organization/presentation/routes/organization.routes.ts
// NEW FILE
// ============================================================================

import { Router }

from "express";

import { OrganizationController }

from "../controllers/organization.controller.js";

export function organizationRoutes(

    controller: OrganizationController

){

    const router = Router();

    router.post(

        "/",

        controller.create.bind(controller)

    );

    router.get(

        "/:id",

        controller.overview.bind(controller)

    );

    router.get(

        "/:id/statistics",

        controller.statistics.bind(controller)

    );

    return router;

}
