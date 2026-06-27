// ============================================================================
// FILE: /backend/src/controllers/dashboard.controller.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import * as DashboardService from "../services/dashboard.service.js";
import * as EventService from "../services/event.service.js";
import * as NotificationService from "../services/notification.service.js";

export async function overview(req, res) {

    try {

        const dashboard = await DashboardService.dashboard(req.user.id);

        const timeline = await EventService.byProfile(req.user.id, 25);

        const notifications = await NotificationService.unread(req.user.id);

        res.json({

            success: true,

            dashboard,

            timeline,

            notifications,

            generated_at: new Date()

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}

export async function refresh(req, res) {

    try {

        const dashboard = await DashboardService.dashboard(req.user.id);

        res.json({

            success: true,

            dashboard

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}
