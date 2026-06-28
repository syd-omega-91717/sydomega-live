// ============================================================================
// FILE: /backend/src/modules/approval/approval.service.ts
// NEW FILE
// ============================================================================

import { BaseService } from "../../core/base.service.js";

import { Result } from "../../core/result.js";

import security from "../../config/security.js";

import approvalRepository from "./approval.repository.js";

import {

    ApprovalDecision,

    ApprovalRequest,

    ApprovalResult

} from "./approval.types.js";

export class ApprovalService extends BaseService {

    public async pending()

    : Promise<Result<ApprovalRequest[]>> {

        return this.execute(

            () => approvalRepository.findPending()

        );

    }

    public async approved()

    : Promise<Result<ApprovalRequest[]>> {

        return this.execute(

            () => approvalRepository.findApproved()

        );

    }

    public async rejected()

    : Promise<Result<ApprovalRequest[]>> {

        return this.execute(

            () => approvalRepository.findRejected()

        );

    }

    public async create(

        payload: Partial<ApprovalRequest>

    ): Promise<Result<ApprovalRequest>> {

        return this.execute(

            () => approvalRepository.createRequest(payload)

        );

    }

    public async approve(

        decision: ApprovalDecision

    ): Promise<Result<ApprovalResult>> {

        return this.execute(

            async () => {

                const request =

                    await approvalRepository.findOne(

                        decision.requestId

                    );

                if (request.isFailure) {

                    return Result.fail(

                        request.error ?? "Approval request not found.",

                        "NOT_FOUND"

                    );

                }

                const expiresAt = new Date(

                    Date.now() +

                    security.accessDurationSeconds * 1000

                );

                const update =

                    await approvalRepository.updateStatus(

                        decision.requestId,

                        "approved",

                        {

                            reviewed_by:

                                decision.founderId,

                            reviewed_at:

                                new Date(),

                            expires_at:

                                expiresAt

                        }

                    );

                if (update.isFailure) {

                    return Result.fail(

                        update.error ?? "Approval failed.",

                        update.code

                    );

                }

                await this.audit(

                    "approval.approved",

                    {

                        requestId:

                            decision.requestId,

                        founderId:

                            decision.founderId

                    }

                );

                return Result.ok({

                    success: true,

                    expires_at: expiresAt,

                    duration_seconds:

                        security.accessDurationSeconds

                });

            }

        );

    }

    public async reject(

        decision: ApprovalDecision

    ): Promise<Result<ApprovalResult>> {

        return this.execute(

            async () => {

                const request =

                    await approvalRepository.findOne(

                        decision.requestId

                    );

                if (request.isFailure) {

                    return Result.fail(

                        request.error ?? "Approval request not found.",

                        "NOT_FOUND"

                    );

                }

                const update =

                    await approvalRepository.updateStatus(

                        decision.requestId,

                        "rejected",

                        {

                            reviewed_by:

                                decision.founderId,

                            reviewed_at:

                                new Date(),

                            rejection_reason:

                                decision.reason ?? null

                        }

                    );

                if (update.isFailure) {

                    return Result.fail(

                        update.error ?? "Rejection failed.",

                        update.code

                    );

                }

                await this.audit(

                    "approval.rejected",

                    {

                        requestId:

                            decision.requestId,

                        founderId:

                            decision.founderId

                    }

                );

                return Result.ok({

                    success: true

                });

            }

        );

    }

}

export default new ApprovalService();
