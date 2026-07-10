// ============================================================================
// FILE: backend/middleware/logger.js
// Ω SYD OMEGA 91717
// Enterprise Request Logger
// ============================================================================

export default function logger(req, res, next) {

    const started = Date.now();

    res.on("finish", () => {

        const duration = Date.now() - started;

        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
        );

    });

    next();

}
