// ============================================================================
// FILE: /backend/src/modules/identity/presentation/routes/registration.routes.ts
// NEW FILE
// ============================================================================

import { Router } from "express";

import controller from "../controllers/registration.controller.js";

const router = Router();

router.post(

    "/register",

    controller.register.bind(

        controller

    )

);

export default router;
