// ============================================================================
// FILE: backend/controllers/system.controller.js
// Ω SYD OMEGA 91717
// Enterprise System Controller
// ============================================================================

import os from "os";

export function systemInformation(req, res) {

    res.json({

        application: "Ω SYD OMEGA 91717",

        environment: process.env.NODE_ENV,

        version: "2.0.0",

        node: process.version,

        platform: process.platform,

        architecture: process.arch,

        hostname: os.hostname(),

        cpus: os.cpus().length,

        memory: {

            total: os.totalmem(),

            free: os.freemem()

        },

        uptime: process.uptime(),

        timestamp: new Date().toISOString()

    });

}
