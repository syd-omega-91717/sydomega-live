// ============================================================================
// FILE: /backend/src/routes/founderDashboard.js
// NEW / REPLACE ENTIRE FILE
// ============================================================================

import { Router } from "express";

import { session } from "../middleware/session.js";
import { accessControl } from "../middleware/accessControl.js";
import { authorize } from "../middleware/rbac.js";

import * as Controller from "../controllers/founderDashboard.controller.js";

const router = Router();

router.use(

    session,

    accessControl,

    authorize("founder", "read")

);

router.get(

    "/",

    Controller.overview

);

router.get(

    "/statistics",

    Controller.statistics

);

router.get(

    "/timeline",

    Controller.timeline

);

router.get(

    "/metrics",

    Controller.metrics

);

router.get(

    "/activity",

    Controller.activity

);

export default router;
