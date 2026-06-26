import { Router } from "express";

import { authenticate } from "../middleware/auth";

import * as StorageController from "../controllers/storage.controller";

const router = Router();

router.get(

    "/",

    authenticate,

    StorageController.list

);

router.post(

    "/",

    authenticate,

    StorageController.upload

);

router.delete(

    "/:id",

    authenticate,

    StorageController.remove

);

export default router;
