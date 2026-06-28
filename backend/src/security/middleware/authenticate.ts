// ============================================================================
// FILE: /backend/src/security/middleware/authenticate.ts
// NEW FILE
// ============================================================================

import { NextFunction, Request, Response } from "express";

import jwtService from "../authentication/jwt.service.js";

export interface AuthenticatedRequest extends Request {

    identity?: {

        id: string;

        email: string;

        role: string;

        sessionId?: string;

    };

}

export function authenticate(

    req: AuthenticatedRequest,

    res: Response,

    next: NextFunction

) {

    try {

        const header = req.headers.authorization;

        if (!header) {

            return res.status(401).json({

                success: false,

                message: "Authorization header missing."

            });

        }

        const token = header.replace(

            "Bearer ",

            ""

        );

        const payload = jwtService.verify<any>(

            token

        );

        req.identity = {

            id: payload.sub,

            email: payload.email,

            role: payload.role,

            sessionId: payload.sid

        };

        next();

    }

    catch {

        return res.status(401).json({

            success: false,

            message: "Invalid or expired token."

        });

    }

}
