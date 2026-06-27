import {Router} from "express";

import {session} from "../middleware/session";

import {accessControl} from "../middleware/accessControl";

import {authorize} from "../middleware/rbac";

import * as Controller from "../controllers/founderDashboard.controller";

const router=Router();

router.get(

"/",

session,

accessControl,

authorize("founder","read"),

Controller.overview

);

export default router;
