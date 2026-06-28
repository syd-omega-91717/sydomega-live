// ============================================================================
// FILE: /backend/src/modules/identity/presentation/routes/identity.routes.ts
// NEW FILE
// ============================================================================

import { Router } from "express";

import controller from "../controllers/identity.controller.js";

const router = Router();

router.post(

    "/login",

    controller.login

);

export default router;
