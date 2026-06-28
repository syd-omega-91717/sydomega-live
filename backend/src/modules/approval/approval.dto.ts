// ============================================================================
// FILE: /backend/src/modules/approval/approval.dto.ts
// NEW FILE
// ============================================================================

import { z } from "zod";

export const CreateApprovalRequestDto = z.object({

    request_type: z.string(),

    requested_role: z.string(),

    requested_plan: z.string(),

    notes: z.string().optional()

});

export const ApprovalDecisionDto = z.object({

    founderId: z.string().uuid(),

    reason: z.string().optional()

});

export type CreateApprovalRequestDtoType =

    z.infer<typeof CreateApprovalRequestDto>;

export type ApprovalDecisionDtoType =

    z.infer<typeof ApprovalDecisionDto>;
