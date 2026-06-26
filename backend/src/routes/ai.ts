import {Router} from "express";

import {authenticate} from "../middleware/auth";

import * as AI from "../controllers/ai.controller";

const router=Router();

router.get(

    "/conversations",

    authenticate,

    AI.conversations

);

router.post(

    "/conversations",

    authenticate,

    AI.conversation

);

router.post(

    "/messages",

    authenticate,

    AI.message

);

export default router;
