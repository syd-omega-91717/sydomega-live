import { Router } from "express";

import { authenticate } from "../middleware/auth";

import * as TaskController from "../controllers/task.controller";

const router = Router();

router.get(

    "/",

    authenticate,

    TaskController.list

);

router.post(

    "/",

    authenticate,

    TaskController.create

);

router.put(

    "/:id",

    authenticate,

    TaskController.update

);

router.delete(

    "/:id",

    authenticate,

    TaskController.remove

);

export default router;
