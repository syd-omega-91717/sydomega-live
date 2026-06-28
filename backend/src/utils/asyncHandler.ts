// ============================================================================
// FILE: /backend/src/utils/asyncHandler.ts
// NEW FILE
// ============================================================================

import { Request, Response, NextFunction } from "express";

export function asyncHandler(

    fn: (

        req: Request,

        res: Response,

        next: NextFunction

    ) => Promise<unknown>

) {

    return (

        req: Request,

        res: Response,

        next: NextFunction

    ) => {

        Promise.resolve(fn(req, res, next))

            .catch(next);

    };

}
