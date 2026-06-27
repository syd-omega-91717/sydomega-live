// ============================================================================
// FILE: /backend/src/middleware/approval.js
// NEW FILE
// ============================================================================

export default function approvalRequired(req, res, next) {

    const profile = req.profile;

    if (!profile) {

        return res.status(401).json({

            success: false,

            message: "Authentication required."

        });

    }

    if (!profile.account_enabled) {

        return res.status(403).json({

            success: false,

            message: "Account disabled."

        });

    }

    if (profile.approval_status !== "approved") {

        return res.status(403).json({

            success: false,

            message: "Founder approval required."

        });

    }

    next();

}
