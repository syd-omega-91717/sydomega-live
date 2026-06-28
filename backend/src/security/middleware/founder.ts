// ============================================================================
// FILE: /backend/src/security/middleware/founder.ts
// NEW FILE
// ============================================================================

import {

    Response,

    NextFunction

} from "express";

import {

    AuthenticatedRequest

} from "./authenticate.js";

export function founder(

    req: AuthenticatedRequest,

    res: Response,

    next: NextFunction

) {

    if (

        !req.identity ||

        req.identity.role !== "founder"

    ) {

        return res.status(403).json({

            success: false,

            message: "Founder access required."

        });

    }

    next();

}
