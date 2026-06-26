import { Router } from "express";

import { authenticate } from "../middleware/auth";

import * as WebhookController from "../controllers/webhook.controller";

const router = Router();

router.get(

    "/",

    authenticate,

    WebhookController.list

);

router.post(

    "/",

    authenticate,

    WebhookController.create

);

export default router;
