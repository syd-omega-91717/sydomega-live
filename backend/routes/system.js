// ============================================================================
// FILE: backend/routes/system.js
// Ω SYD OMEGA 91717
// Enterprise System Routes
// ============================================================================

import { Router } from "express";

import { health } from "../controllers/health.controller.js";
import { systemInformation } from "../controllers/system.controller.js";

const router = Router();

router.get("/health", health);

router.get("/info", systemInformation);

router.get("/ping", (req, res) => {

    res.json({

        success: true,

        message: "pong",

        timestamp: new Date().toISOString()

    });

});

export default router;
