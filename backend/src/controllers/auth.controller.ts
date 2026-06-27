// ============================================================================
// FILE: /backend/src/controllers/auth.controller.js
// NEW FILE
// ============================================================================

import * as Auth from "../services/auth.service.js";

export async function login(req, res) {

    try {

        const result = await Auth.login(

            req.body.email,

            req.body.password

        );

        res.json({

            success: true,

            ...result

        });

    }

    catch (error) {

        res.status(401).json({

            success: false,

            message: error.message

        });

    }

}

export async function logout(req, res) {

    await Auth.logout();

    res.json({

        success: true

    });

}

export async function requestAccess(req, res) {

    try {

        const approval = await Auth.requestAccess(

            req.user.id

        );

        res.json({

            success: true,

            approval

        });

    }

    catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

}
