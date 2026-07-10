// ============================================================================
// FILE: backend/middleware/errorHandler.js
// Ω SYD OMEGA 91717
// Enterprise Error Handler
// ============================================================================

export default function errorHandler(err, req, res, next) {

    console.error(err);

    res.status(err.status || 500).json({

        success: false,

        message: err.message || "Internal Server Error",

        timestamp: new Date().toISOString(),

        path: req.originalUrl

    });

}
