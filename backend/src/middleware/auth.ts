import { Request, Response, NextFunction } from "express";

export async function authenticate(

    req: Request,

    res: Response,

    next: NextFunction

) {

    const token = req.headers.authorization;

    if (!token) {

        return res.status(401).json({

            success: false,

            message: "Unauthorized"

        });

    }

    next();

}
