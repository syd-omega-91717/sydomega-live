// ============================================================================
// FILE: backend/controllers/health.controller.js
// Ω SYD OMEGA 91717
// Health Controller
// ============================================================================

import database from "../database/database.js";

export async function health(req, res) {

    const databaseStatus = await database.health();

    res.status(databaseStatus.success ? 200 : 500).json({

        application: "Ω SYD OMEGA 91717",

        version: "2.0.0",

        status: databaseStatus.success ? "ONLINE" : "OFFLINE",

        uptime: process.uptime(),

        database: databaseStatus,

        serverTime: new Date().toISOString()

    });

}
