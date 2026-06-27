// ============================================================================
// FILE: /backend/src/middleware/logger.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import logger from "../config/logger.js";

export default function requestLogger(req, res, next) {

    const started = Date.now();

    res.on("finish", () => {

        logger.info("HTTP Request", {

            requestId: req.requestId,

            method: req.method,

            path: req.originalUrl,

            status: res.statusCode,

            duration: Date.now() - started,

            ip: req.ip

        });

    });

    next();

}
