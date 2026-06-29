// ============================================================================
// FILE: /backend/src/modules/founder/presentation/routes/widget-layout.routes.ts
// NEW FILE
// ============================================================================

import { Router }

from "express";

import controller

from "../controllers/widget-layout.controller.js";

const router = Router();

router.get(

    "/layout",

    controller.layout.bind(

        controller

    )

);

export default router;
