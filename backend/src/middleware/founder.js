// ============================================================================
// FILE: /backend/src/middleware/founder.js
// NEW FILE
// ============================================================================

import security from "../config/security.js";

export default function founderOnly(req, res, next) {

    const profile = req.profile;

    if (!profile) {

        return res.status(401).json({

            success: false,

            message: "Authentication required."

        });

    }

    const email = String(profile.email || "").toLowerCase();

    if (!security.founderEmails.includes(email)) {

        return res.status(403).json({

            success: false,

            message: "Founder access required."

        });

    }

    next();

}
