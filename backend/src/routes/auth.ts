import { Router } from "express";

import * as Controller from "../controllers/auth.controller";

const router = Router();

router.post("/register", Controller.register);

router.post("/login", Controller.login);

router.post("/refresh", Controller.refresh);

router.post("/reset-password", Controller.reset);

router.post("/logout", Controller.logout);

router.get("/me", Controller.me);

export default router;
