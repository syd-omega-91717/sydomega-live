import { Request, Response } from "express";

export function notFound(
    req: Request,
    res: Response
) {
    return res.status(404).json({
        success: false,
        error: {
            message: "Endpoint not found"
        }
    });
}
