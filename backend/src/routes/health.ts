import { Router } from "express";

const router = Router();

router.get("/", async (_, res) => {

    res.json({

        status: "healthy",

        database: "connected",

        api: "online",

        timestamp: new Date()

    });

});

export default router;
