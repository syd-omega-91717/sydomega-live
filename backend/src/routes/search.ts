import { Router } from "express";

import { authenticate } from "../middleware/auth";

import * as SearchController from "../controllers/search.controller";

const router = Router();

router.get(

    "/",

    authenticate,

    SearchController.search

);

export default router;
