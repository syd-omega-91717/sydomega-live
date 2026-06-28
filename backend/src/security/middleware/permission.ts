// ============================================================================
// FILE: /backend/src/security/middleware/permission.ts
// NEW FILE
// ============================================================================

import {

    Response,

    NextFunction

} from "express";

import {

    AuthenticatedRequest

} from "./authenticate.js";

export function permission(

    predicate: (

        identity: NonNullable<AuthenticatedRequest["identity"]>

    ) => boolean

) {

    return (

        req: AuthenticatedRequest,

        res: Response,

        next: NextFunction

    ) => {

        if (

            !req.identity

        ) {

            return res.status(401).json({

                success: false,

                message: "Unauthenticated."

            });

        }

        if (

            !predicate(

                req.identity

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
