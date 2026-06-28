// ============================================================================
// FILE: /backend/src/modules/approval/approval.repository.ts
// NEW FILE
// ============================================================================

import { BaseRepository } from "../../repositories/base.repository.js";

import { Result } from "../../core/result.js";

import {

    ApprovalRequest,

    ApprovalStatus

} from "./approval.types.js";

export class ApprovalRepository extends BaseRepository<ApprovalRequest> {

    constructor() {

        super("approval_requests");

    }

    public async findPending(): Promise<Result<ApprovalRequest[]>> {

        return this.many(

            this.table()

                .select("*")

                .eq("current_status", "pending")

                .order("created_at", {

                    ascending: false

                })

        );

    }

    public async findApproved(): Promise<Result<ApprovalRequest[]>> {

        return this.many(

            this.table()

                .select("*")

                .eq("current_status", "approved")

                .order("reviewed_at", {

                    ascending: false

                })

        );

    }

    public async findRejected(): Promise<Result<ApprovalRequest[]>> {

        return this.many(

            this.table()

                .select("*")

                .eq("current_status", "rejected")

                .order("reviewed_at", {

                    ascending: false

                })

        );

    }

    public async findByStatus(

        status: ApprovalStatus

    ): Promise<Result<ApprovalRequest[]>> {

        return this.many(

            this.table()

                .select("*")

                .eq("current_status", status)

                .order("created_at", {

                    ascending: false

                })

        );

    }

    public async findByProfile(

        profileId: string

    ): Promise<Result<ApprovalRequest[]>> {

        return this.many(

            this.table()

                .select("*")

                .eq("profile_id", profileId)

                .order("created_at", {

                    ascending: false

                })

        );

    }

    public async findOne(

        requestId: string

    ): Promise<Result<ApprovalRequest>> {

        return this.single(

            this.table()

                .select("*")

                .eq("id", requestId)

                .single()

        );

    }

    public async createRequest(

        request: Partial<ApprovalRequest>

    ): Promise<Result<ApprovalRequest>> {

        return this.single(

            this.table()

                .insert(request)

                .select()

                .single()

        );

    }

    public async updateStatus(

        requestId: string,

        status: ApprovalStatus,

        payload: Record<string, unknown>

    ): Promise<Result<ApprovalRequest>> {

        return this.single(

            this.table()

                .update({

                    current_status: status,

                    ...payload

                })

                .eq("id", requestId)

                .select()

                .single()

        );

    }

}

export default new ApprovalRepository();
