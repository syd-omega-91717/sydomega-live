// ============================================================================
// FILE: /backend/src/routes/academy.js
// ============================================================================

import {Router} from "express";

import {session} from "../middleware/session.js";
import {accessControl} from "../middleware/accessControl.js";

import * as Controller from "../controllers/academy.controller.js";

const router=Router();

router.use(

    session,

    accessControl

);

router.get(

    "/dashboard",

    Controller.dashboard

);

router.post(

    "/enroll/:courseId",

    Controller.enroll

);

router.post(

    "/lesson/:lessonId/complete",

    Controller.completeLesson

);

export default router;
