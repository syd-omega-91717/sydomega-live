// ============================================================================
// FILE: /backend/src/routes/auth.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { Router } from "express";

import { session } from "../middleware/session.js";

import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

router.post(

    "/login",

    AuthController.login

);

router.post(

    "/logout",

    session,

    AuthController.logout

);

router.post(

    "/request-access",

    session,

    AuthController.requestAccess

);

export default router;
