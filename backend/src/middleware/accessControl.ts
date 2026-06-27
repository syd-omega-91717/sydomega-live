import { Response, NextFunction } from "express";
import * as Access from "../services/access.service";

export async function accessControl(
    req: any,
    res: Response,
    next: NextFunction
) {

    try {

        await Access.validate(req.user.id);

        next();

    } catch (e: any) {

        return res.status(403).json({

            success: false,

            message: e.message

        });

    }

}
