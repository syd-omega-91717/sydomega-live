// ============================================================================
// FILE: /backend/src/middleware/errorHandler.js
// NEW FILE
// ============================================================================

export default function errorHandler(

    err,

    req,

    res,

    next

) {

    console.error(err);

    return res.status(err.status || 500).json({

        success: false,

        code:

            err.code ||

            "INTERNAL_SERVER_ERROR",

        message:

            err.message ||

            "Internal Server Error",

        requestId: req.requestId,

        timestamp: new Date()

    });

}
