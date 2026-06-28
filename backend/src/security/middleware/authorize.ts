// ============================================================================
// FILE: /backend/src/security/middleware/authorize.ts
// NEW FILE
// ============================================================================

import {

    NextFunction,

    Response

} from "express";

import {

    AuthenticatedRequest

} from "./authenticate.js";

export function authorize(

    ...roles: string[]

) {

    return (

        req: AuthenticatedRequest,

        res: Response,

        next: NextFunction

    ) => {

        if (!req.identity) {

            return res.status(401).json({

                success: false,

                message: "Unauthenticated."

            });

        }

        if (

            !roles.includes(

                req.identity.role

            )

        ) {

            return res.status(403).json({

                success: false,

                message: "Permission denied."

            });

        }

        next();

    };

}
