// ============================================================================
// FILE: /backend/src/modules/identity/presentation/routes/identity.routes.ts
// REPLACE THE ENTIRE FILE
// ============================================================================

import { Router } from "express";

import controller from "../controllers/identity.controller.js";

const router = Router();

router.post(

    "/login",

    controller.login.bind(controller)

);

export default router;
