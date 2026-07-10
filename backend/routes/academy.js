// ============================================================================
// FILE: backend/routes/academy.js
// Ω SYD OMEGA 91717
// Academy Routes
// ============================================================================

import { Router } from "express";

const router = Router();

router.get("/courses", (req, res) => {

    res.json({

        success: true,

        courses: []

    });

});

router.get("/categories", (req, res) => {

    res.json({

        success: true,

        categories: []

    });

});

router.post("/enroll", (req, res) => {

    res.json({

        success: true,

        message: "Enrollment completed."

    });

});

export default router;
