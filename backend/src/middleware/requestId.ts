// ============================================================================
// FILE: /backend/src/middleware/requestId.js
// NEW FILE
// ============================================================================

import crypto from "crypto";

export default function requestId(req, res, next) {

    const id = crypto.randomUUID();

    req.requestId = id;

    res.setHeader("X-Request-ID", id);

    next();

}
