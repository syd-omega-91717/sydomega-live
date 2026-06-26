import express from "express";
import {system} from "../controllers/system.controller.js";

const router=express.Router();

router.get("/",system);

export default router;
