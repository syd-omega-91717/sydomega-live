// ============================================================================
// FILE: /backend/src/ai/routes/ai.routes.js
// ============================================================================

import {Router} from "express";

import {session} from "../../middleware/session.js";
import {accessControl} from "../../middleware/accessControl.js";

import * as AIController from "../controllers/ai.controller.js";

const router=Router();

router.use(

    session,

    accessControl

);

router.post(

    "/chat",

    AIController.chat

);

export default router;
