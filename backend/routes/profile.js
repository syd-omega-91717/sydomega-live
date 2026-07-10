// ============================================================================
// FILE: backend/routes/profile.js
// Ω SYD OMEGA 91717
// User Profile Routes
// ============================================================================

import { Router } from "express";

import authenticate from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, (req, res) => {

    res.json({

        success: true,

        profile: req.user

    });

});

router.put("/", authenticate, (req, res) => {

    res.json({

        success: true,

        message: "Profile updated.",

        data: req.body

    });

});

export default router;
