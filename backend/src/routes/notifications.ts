import {Router} from "express";

import {session} from "../middleware/session";

import * as Controller from "../controllers/notification.controller";

const router=Router();

router.get(

    "/",

    session,

    Controller.unread

);

router.post(

    "/:id/read",

    session,

    Controller.read

);

export default router;
