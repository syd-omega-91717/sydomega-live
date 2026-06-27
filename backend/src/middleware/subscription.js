// ============================================================================
// FILE: /backend/src/middleware/subscription.js
// NEW FILE
// ============================================================================

export default function subscriptionRequired(req, res, next) {

    const profile = req.profile;

    if (!profile) {

        return res.status(401).json({

            success: false,

            message: "Authentication required."

        });

    }

    if (!profile.subscription_active) {

        return res.status(402).json({

            success: false,

            message: "Active subscription required."

        });

    }

    next();

}
