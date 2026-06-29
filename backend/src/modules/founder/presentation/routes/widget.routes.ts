// ============================================================================
// FILE: /backend/src/modules/founder/presentation/routes/widget.routes.ts
// NEW FILE
// ============================================================================

import { Router }

from "express";

import controller

from "../controllers/widget.controller.js";

const router=Router();

router.get(

    "/widgets",

    controller.list.bind(controller)

);

export default router;
