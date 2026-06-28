// ============================================================================
// FILE: /backend/src/middleware/notFound.ts
// NEW FILE
// ============================================================================

import { Request, Response } from "express";

export default function notFound(

    _req: Request,

    res: Response

): void {

    res.status(404).json({

        success: false,

        message: "Endpoint not found."

    });

}
