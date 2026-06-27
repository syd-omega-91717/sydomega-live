// ============================================================================
// FILE: /backend/src/routes/dashboard.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { Router } from "express";

import { session } from "../middleware/session.js";
import { accessControl } from "../middleware/accessControl.js";

import * as DashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.use(

    session,

    accessControl

);

router.get(

    "/",

    DashboardController.overview

);

router.get(

    "/refresh",

    DashboardController.refresh

);

export default router;
