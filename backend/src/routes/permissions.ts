import { Router } from "express";

import { authenticate } from "../middleware/auth";

import { authorize } from "../middleware/rbac";

import * as Controller from "../controllers/permission.controller";

const router = Router();

router.get(

    "/",

    authenticate,

    authorize("permissions","read"),

    Controller.list

);

export default router;
