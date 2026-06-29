// ============================================================================
// FILE: /backend/src/modules/organization/presentation/middleware/organization-access.middleware.ts
// NEW FILE
// ============================================================================

import { Request, Response, NextFunction }

from "express";

export async function organizationAccess(

    req: Request,

    res: Response,

    next: NextFunction

){

    if(!req.user){

        return res.status(401).json({

            success:false,

            message:"Unauthorized"

        });

    }

    next();

}
