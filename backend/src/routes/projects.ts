import { Router } from "express";

const router = Router();

router.get("/", async (_, res) => {

    res.json({

        success: true,

        data: []

    });

});

router.post("/", async (req, res) => {

    res.json({

        success: true,

        payload: req.body

    });

});

export default router;
