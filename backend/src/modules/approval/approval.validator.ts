// ============================================================================
// FILE: /backend/src/modules/approval/approval.validator.ts
// NEW FILE
// ============================================================================

import {

    ApprovalDecisionDto,

    CreateApprovalRequestDto

} from "./approval.dto.js";

export function validateCreateRequest(

    payload: unknown

) {

    return CreateApprovalRequestDto.parse(

        payload

    );

}

export function validateDecision(

    payload: unknown

) {

    return ApprovalDecisionDto.parse(

        payload

    );

}
