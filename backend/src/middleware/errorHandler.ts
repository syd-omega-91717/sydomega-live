// ============================================================================
// FILE: /backend/src/middleware/errorHandler.ts
// NEW FILE
// ============================================================================

import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import { AppError } from "../utils/errors.js";

export default function errorHandler(

    err: Error,

    req: Request,

    res: Response,

    _next: NextFunction

): void {

    logger.error({

        requestId: req.requestId,

        message: err.message,

        stack: err.stack

    });

    if (err instanceof AppError) {

        res.status(err.status).json({

            success: false,

            code: err.code,

            message: err.message

        });

        return;

    }

    res.status(500).json({

        success: false,

        code: "INTERNAL_SERVER_ERROR",

        message: "Internal Server Error"

    });

}
