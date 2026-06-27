// ============================================================================
// FILE: /backend/src/controllers/notification.controller.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import * as Notification from "../services/notification.service.js";

export async function unread(req, res) {

    try {

        const data = await Notification.unread(req.user.id);

        const count = await Notification.count(req.user.id);

        res.json({

            success: true,

            unread: count,

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

export async function all(req, res) {

    try {

        const data = await Notification.all(req.user.id);

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

export async function read(req, res) {

    try {

        const data = await Notification.read(req.params.id);

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

export async function readAll(req, res) {

    try {

        await Notification.markAllRead(req.user.id);

        res.json({

            success: true

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}

export async function remove(req, res) {

    try {

        await Notification.remove(req.params.id);

        res.json({

            success: true

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}
