// ============================================================================
// FILE: /backend/src/routes/marketplace.js
// REPLACE ENTIRE FILE
// ============================================================================

import {Router} from "express";

import {session} from "../middleware/session.js";
import {accessControl} from "../middleware/accessControl.js";
import {authorize} from "../middleware/rbac.js";

import * as Controller from "../controllers/marketplace.controller.js";

const router=Router();

router.get(

    "/",

    session,

    accessControl,

    Controller.listings

);

router.get(

    "/mine",

    session,

    accessControl,

    Controller.mine

);

router.post(

    "/",

    session,

    accessControl,

    Controller.create

);

router.post(

    "/:id/approve",

    session,

    accessControl,

    authorize("marketplace","approve"),

    Controller.approve

);

export default router;
