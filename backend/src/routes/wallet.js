// ============================================================================
// FILE: /backend/src/routes/wallet.js
// NEW FILE
// ============================================================================

import {Router} from "express";

import {session} from "../middleware/session.js";
import {accessControl} from "../middleware/accessControl.js";

import * as Controller from "../controllers/wallet.controller.js";

const router=Router();

router.use(

    session,

    accessControl

);

router.get(

    "/",

    Controller.overview

);

router.post(

    "/transfer",

    Controller.transfer

);

export default router;
