// ============================================================================
// FILE: /backend/src/utils/response.ts
// NEW FILE
// ============================================================================

import { Response } from "express";
import { ApiResponse } from "../types/ApiResponse.js";

export function ok<T>(
    res: Response,
    data?: T,
    message = "Success"
): Response<ApiResponse<T>> {

    return res.status(200).json({

        success: true,

        message,

        data

    });

}

export function created<T>(
    res: Response,
    data?: T,
    message = "Created"
): Response<ApiResponse<T>> {

    return res.status(201).json({

        success: true,

        message,

        data

    });

}

export function fail(
    res: Response,
    status = 400,
    message = "Request Failed",
    errors?: unknown
): Response<ApiResponse> {

    return res.status(status).json({

        success: false,

        message,

        errors

    });

}
