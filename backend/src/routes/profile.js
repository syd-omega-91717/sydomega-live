// ============================================================================
// FILE: /backend/src/routes/profile.js
// REPLACE ENTIRE FILE
// ============================================================================

import {Router} from "express";

import {session} from "../middleware/session.js";
import {accessControl} from "../middleware/accessControl.js";

import * as Controller from "../controllers/profile.controller.js";

const router=Router();

router.use(

    session,

    accessControl

);

router.get(

    "/me",

    Controller.me

);

router.put(

    "/",

    Controller.update

);

router.get(

    "/preferences",

    Controller.preferences

);

router.put(

    "/preferences",

    Controller.savePreferences

);

router.get(

    "/devices",

    Controller.devices

);

router.get(

    "/activity",

    Controller.activity

);

export default router;
