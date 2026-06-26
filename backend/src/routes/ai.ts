import { Router } from "express";

const router = Router();

router.post("/chat", async (req, res) => {

    res.json({

        success: true,

        provider: req.body.provider,

        model: req.body.model,

        message: "AI Gateway Ready"

    });

});

export default router;
