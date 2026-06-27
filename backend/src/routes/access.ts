import { Router } from "express";

import { session } from "../middleware/session";

import { accessControl } from "../middleware/accessControl";

const router = Router();

router.get(

    "/validate",

    session,

    accessControl,

    (req, res) => {

        res.json({

            success: true,

            active: true

        });

    }

);

export default router;
