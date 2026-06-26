import { Router } from "express";

import * as ProjectController from "../controllers/project.controller";

import { authenticate } from "../middleware/auth";

const router = Router();

router.get(

    "/",

    authenticate,

    ProjectController.list

);

router.post(

    "/",

    authenticate,

    ProjectController.create

);

export default router;
