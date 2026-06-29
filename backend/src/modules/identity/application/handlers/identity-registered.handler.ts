// ============================================================================
// FILE: /backend/src/modules/identity/application/handlers/identity-registered.handler.ts
// NEW FILE
// ============================================================================

import type {

    EventHandler

}

from "../../../../platform/events/event-bus.js";

import type {

    DomainEvent

}

from "../../../../platform/events/domain-event.interface.js";

import * as ApprovalService

from "../../../../services/approval.service.js";

export class IdentityRegisteredHandler

implements EventHandler {

    async handle(

        event: DomainEvent

    ): Promise<void> {

        const payload =

            event.payload as {

                identityId: string;

            };

        await ApprovalService

            .createApprovalRequest(

                payload.identityId

            );

    }

}

export default new IdentityRegisteredHandler();
