// ============================================================================
// FILE: /backend/src/middleware/rateLimiter.ts
// NEW FILE
// ============================================================================

import rateLimit from "express-rate-limit";

export default rateLimit({

    windowMs: 60 * 1000,

    max: 120,

    standardHeaders: true,

    legacyHeaders: false

});
