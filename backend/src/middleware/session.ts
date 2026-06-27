// ============================================================================
// FILE: /backend/src/middleware/session.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import jwt from "jsonwebtoken";

export async function session(req, res, next) {

    try {

        const header = req.headers.authorization;

        if (!header)

            return res.status(401).json({

                success: false,

                message: "Missing authorization header."

            });

        const token = header.replace("Bearer ", "");

        const payload = jwt.verify(

            token,

            process.env.JWT_SECRET

        );

        req.user = {

            id: payload.sub,

            email: payload.email

        };

        next();

    }

    catch (error) {

        return res.status(401).json({

            success: false,

            message: "Invalid session."

        });

    }

}
