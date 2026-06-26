import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}

export function requestId(
    req: Request,
    res: Response,
    next: NextFunction
) {

    req.requestId = randomUUID();

    res.setHeader(
        "X-Request-ID",
        req.requestId
    );

    next();

}
