import { Router } from "express";

import { authenticate } from "../middleware/auth";

import { authorize } from "../middleware/rbac";

import * as Controller from "../controllers/role.controller";

const router = Router();

router.get(

    "/",

    authenticate,

    authorize("roles","read"),

    Controller.list

);

router.post(

    "/",

    authenticate,

    authorize("roles","create"),

    Controller.create

);

export default router;
