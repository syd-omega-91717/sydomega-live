// ============================================================================
// FILE: /backend/src/middleware/audit.ts
// NEW FILE
// ============================================================================

import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";

export default function audit(

    req: Request,

    _res: Response,

    next: NextFunction

): void {

    logger.info({

        requestId: req.requestId,

        method: req.method,

        path: req.originalUrl,

        ip: req.ip

    });

    next();

}
