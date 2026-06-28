// ============================================================================
// FILE: /backend/src/modules/approval/approval.events.ts
// NEW FILE
// ============================================================================

import eventBus from "../../core/eventBus.js";

export const ApprovalEvents = {

    REQUEST_CREATED:

        "approval.request.created",

    APPROVED:

        "approval.approved",

    REJECTED:

        "approval.rejected",

    EXPIRED:

        "approval.expired",

    RENEWED:

        "approval.renewed"

};

export function registerApprovalEvents(): void {

    eventBus.on(

        ApprovalEvents.REQUEST_CREATED,

        async event => {

            console.log(

                "[Approval]",

                event.name,

                event.payload

            );

        }

    );

    eventBus.on(

        ApprovalEvents.APPROVED,

        async event => {

            console.log(

                "[Approval]",

                event.name,

                event.payload

            );

        }

    );

    eventBus.on(

        ApprovalEvents.REJECTED,

        async event => {

            console.log(

                "[Approval]",

                event.name,

                event.payload

            );

        }

    );

}
