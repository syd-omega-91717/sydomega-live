import { Router } from "express";

import { session } from "../middleware/session";

import { authorize } from "../middleware/rbac";

import * as Controller from "../controllers/approval.controller";

const router = Router();

router.get(

    "/pending",

    session,

    authorize("approvals","read"),

    Controller.pending

);

router.post(

    "/:id/approve",

    session,

    authorize("approvals","approve"),

    Controller.approve

);

router.post(

    "/:id/reject",

    session,

    authorize("approvals","reject"),

    Controller.reject

);

export default router;
