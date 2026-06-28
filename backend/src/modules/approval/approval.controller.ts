// ============================================================================
// FILE: /backend/src/modules/approval/approval.controller.ts
// NEW FILE
// ============================================================================

import { Request, Response } from "express";

import { BaseController } from "../../core/base.controller.js";

import approvalService from "./approval.service.js";

import {

    validateCreateRequest,

    validateDecision

} from "./approval.validator.js";

export class ApprovalController extends BaseController {

    public pending = this.action(

        async (_req: Request, res: Response) => {

            const result =

                await approvalService.pending();

            this.respond(

                res,

                result

            );

        }

    );

    public approved = this.action(

        async (_req: Request, res: Response) => {

            const result =

                await approvalService.approved();

            this.respond(

                res,

                result

            );

        }

    );

    public rejected = this.action(

        async (_req: Request, res: Response) => {

            const result =

                await approvalService.rejected();

            this.respond(

                res,

                result

            );

        }

    );

    public create = this.action(

        async (req: Request, res: Response) => {

            const payload =

                validateCreateRequest(

                    req.body

                );

            const result =

                await approvalService.create(

                    payload

                );

            this.respond(

                res,

                result,

                201

            );

        }

    );

    public approve = this.action(

        async (req: Request, res: Response) => {

            const payload =

                validateDecision({

                    founderId:

                        req.body.founderId,

                    reason:

                        req.body.reason

                });

            const result =

                await approvalService.approve({

                    requestId:

                        req.params.id,

                    founderId:

                        payload.founderId,

                    reason:

                        payload.reason

                });

            this.respond(

                res,

                result

            );

        }

    );

    public reject = this.action(

        async (req: Request, res: Response) => {

            const payload =

                validateDecision({

                    founderId:

                        req.body.founderId,

                    reason:

                        req.body.reason

                });

            const result =

                await approvalService.reject({

                    requestId:

                        req.params.id,

                    founderId:

                        payload.founderId,

                    reason:

                        payload.reason

                });

            this.respond(

                res,

                result

            );

        }

    );

}

export default new ApprovalController();
