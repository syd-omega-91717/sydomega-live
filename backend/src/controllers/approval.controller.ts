// ============================================================================
// FILE: /backend/src/controllers/approval.controller.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import * as Approval from "../services/approval.service.js";
import * as Access from "../services/access.service.js";

export async function pending(req, res) {

    try {

        const data = await Approval.pending();

        res.json({

            success: true,

            count: data.length,

            data

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

export async function approved(req, res) {

    try {

        const data = await Approval.approved();

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

export async function rejected(req, res) {

    try {

        const data = await Approval.rejected();

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

export async function approve(req, res) {

    try {

        const result = await Approval.approve(

            req.params.id,

            req.user.id

        );

        res.json({

            success: true,

            message: "User approved successfully.",

            expires_at: result.expires_at,

            duration_seconds: result.duration_seconds

        });

    }

    catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

}

export async function reject(req, res) {

    try {

        await Approval.reject(

            req.params.id,

            req.user.id,

            req.body.reason || "Rejected"

        );

        res.json({

            success: true,

            message: "User rejected."

        });

    }

    catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

}

export async function request(req, res) {

    try {

        const approval =

            await Approval.createApprovalRequest(

                req.user.id,

                req.body

            );

        res.status(201).json({

            success: true,

            data: approval

        });

    }

    catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

}

export async function renew(req, res) {

    try {

        const expires =

            await Approval.renew(

                req.user.id

            );

        res.json({

            success: true,

            expires_at: expires

        });

    }

    catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

}

export async function validate(req, res) {

    try {

        const profile =

            await Access.validate(

                req.user.id

            );

        const remaining =

            await Access.remaining(

                req.user.id

            );

        res.json({

            success: true,

            profile,

            remaining_seconds: remaining

        });

    }

    catch (error) {

        res.status(403).json({

            success: false,

            message: error.message

        });

    }

}

export async function extend(req, res) {

    try {

        const expires =

            await Access.extend(

                req.user.id

            );

        res.json({

            success: true,

            expires_at: expires

        });

    }

    catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

}

export async function expireJob(req, res) {

    try {

        const count =

            await Access.expireAll();

        res.json({

            success: true,

            expired_accounts: count

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

}
