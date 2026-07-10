// ============================================================================
// FILE: backend/routes/auth.js
// Ω SYD OMEGA 91717
// Authentication Routes
// ============================================================================

import { Router } from "express";
import authenticate from "../middleware/auth.js";

const router = Router();

router.post("/login", (req, res) => {

    res.json({

        success: true,

        message: "Login endpoint ready."

    });

});

router.post("/register", (req, res) => {

    res.json({

        success: true,

        message: "Register endpoint ready."

    });

});

router.get("/profile", authenticate, (req, res) => {

    res.json({

        success: true,

        user: req.user

    });

});

router.post("/logout", authenticate, (req, res) => {

    res.json({

        success: true,

        message: "Logged out."

    });

});

export default router;
