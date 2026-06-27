// ============================================================================
// FILE: /backend/src/routes/organization.js
// NEW FILE
// ============================================================================

import {Router} from "express";

import {session} from "../middleware/session.js";
import {accessControl} from "../middleware/accessControl.js";

import * as Controller from "../controllers/organization.controller.js";

const router=Router();

router.use(

    session,

    accessControl

);

router.get(

    "/",

    Controller.list

);

router.get(

    "/mine",

    Controller.mine

);

router.post(

    "/",

    Controller.create

);

router.get(

    "/:id/members",

    Controller.members

);

export default router;
