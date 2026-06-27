// ============================================================================
// FILE: /backend/src/controllers/founderDashboard.controller.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import * as Dashboard from "../services/founderDashboard.service.js";
import * as Events from "../services/event.service.js";

export async function overview(req, res) {

    try {

        const statistics = await Dashboard.statistics();

        const timeline = await Dashboard.timeline();

        const metrics = await Events.dashboardMetrics();

        const latest = await Events.latest(20);

        res.json({

            success: true,

            generated_at: new Date(),

            statistics,

            metrics,

            timeline,

            latest

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

export async function statistics(req, res) {

    try {

        const data = await Dashboard.statistics();

        res.json({

            success: true,

            data

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}

export async function timeline(req, res) {

    try {

        const limit = Number(req.query.limit || 100);

        const data = await Dashboard.timeline(limit);

        res.json({

            success: true,

            count: data.length,

            data

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}

export async function metrics(req, res) {

    try {

        const data = await Events.dashboardMetrics();

        res.json({

            success: true,

            data

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}

export async function activity(req, res) {

    try {

        const data = await Events.latest(100);

        res.json({

            success: true,

            count: data.length,

            data

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}
