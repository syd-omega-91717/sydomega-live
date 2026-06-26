import { Request, Response, NextFunction } from "express";

export function logger(
    req: Request,
    res: Response,
    next: NextFunction
) {

    const start = Date.now();

    res.on("finish", () => {

        console.log(
            JSON.stringify({
                requestId: req.requestId,
                method: req.method,
                path: req.originalUrl,
                status: res.statusCode,
                duration: Date.now() - start
            })
        );

    });

    next();

}
