import { Router } from "express";

const router = Router();

router.post("/login", async (_, res) => {

    res.json({

        success: true

    });

});

router.post("/logout", async (_, res) => {

    res.json({

        success: true

    });

});

router.get("/me", async (_, res) => {

    res.json({

        authenticated: true

    });

});

export default router;
