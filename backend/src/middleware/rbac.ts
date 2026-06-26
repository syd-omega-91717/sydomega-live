import { Request, Response, NextFunction } from "express";

import { hasPermission } from "../auth/rbac";

export function authorize(

    resource: string,

    action: string

) {

    return async (

        req: any,

        res: Response,

        next: NextFunction

    ) => {

        const userId = req.user?.id;

        if (!userId)

            return res.status(401).json({

                success: false

            });

        const allowed = await hasPermission(

            userId,

            resource,

            action

        );

        if (!allowed)

            return res.status(403).json({

                success: false,

                message: "Permission denied"

            });

        next();

    };

}
