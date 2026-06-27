// ============================================================================
// FILE: /backend/src/routes/notifications.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { Router } from "express";

import { session } from "../middleware/session.js";
import { accessControl } from "../middleware/accessControl.js";

import * as Controller from "../controllers/notification.controller.js";

const router = Router();

router.use(

    session,

    accessControl

);

router.get(

    "/",

    Controller.unread

);

router.get(

    "/all",

    Controller.all

);

router.post(

    "/read-all",

    Controller.readAll

);

router.post(

    "/:id/read",

    Controller.read

);

router.delete(

    "/:id",

    Controller.remove

);

export default router;
