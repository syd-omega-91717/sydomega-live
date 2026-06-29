// ============================================================================
// FILE: /backend/src/modules/founder/presentation/routes/founder-dashboard.routes.ts
// NEW FILE
// ============================================================================

import { Router } from "express";

import controller

from "../controllers/founder-dashboard.controller.js";

const router = Router();

router.get(

    "/overview",

    controller.overview.bind(controller)

);

export default router;
