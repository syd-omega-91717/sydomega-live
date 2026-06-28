// ============================================================================
// FILE: /backend/src/core/BaseController.ts
// NEW FILE
// ============================================================================

import { Request, Response, NextFunction } from "express";

import { Result } from "./Result.js";

import logger from "../config/logger.js";

export abstract class BaseController {

    /**
     * Standard successful response.
     */
    protected ok<T>(
        res: Response,
        result: Result<T>,
        status = 200
    ): Response {

        return res.status(status).json({

            success: true,

            data: result.data,

            timestamp: new Date().toISOString()

        });

    }

    /**
     * Standard failure response.
     */
    protected fail(
        res: Response,
        result: Result<unknown>,
        status = 400
    ): Response {

        return res.status(status).json({

            success: false,

            error: result.error,

            code: result.code,

            timestamp: new Date().toISOString()

        });

    }

    /**
     * Automatically converts Result<T>
     * into an HTTP response.
     */
    protected respond<T>(
        res: Response,
        result: Result<T>,
        successStatus = 200
    ): Response {

        if (result.isFailure) {

            return this.fail(

                res,

                result,

                this.statusFromCode(result.code)

            );

        }

        return this.ok(

            res,

            result,

            successStatus

        );

    }

    /**
     * Wrap async controller actions.
     */
    protected action(

        handler: (

            req: Request,

            res: Response,

            next: NextFunction

        ) => Promise<void>

    ) {

        return async (

            req: Request,

            res: Response,

            next: NextFunction

        ): Promise<void> => {

            try {

                await handler(

                    req,

                    res,

                    next

                );

            }

            catch (error) {

                logger.error({

                    requestId:

                        (req as Request & {

                            requestId?: string

                        }).requestId,

                    path: req.originalUrl,

                    method: req.method,

                    error

                });

                next(error);

            }

        };

    }

    /**
     * HTTP status mapper.
     */
    protected statusFromCode(

        code?: string

    ): number {

        switch (code) {

            case "VALIDATION_ERROR":

                return 400;

            case "UNAUTHORIZED":

                return 401;

            case "FORBIDDEN":

                return 403;

            case "NOT_FOUND":

                return 404;

            case "CONFLICT":

                return 409;

            default:

                return 500;

        }

    }

    /**
     * Pagination helper.
     */
    protected pagination(

        page = 1,

        limit = 25,

        total = 0

    ) {

        return {

            page,

            limit,

            total,

            pages: Math.ceil(total / limit)

        };

    }

}
