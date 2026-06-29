// ============================================================================
// FILE: /backend/src/modules/organization/infrastructure/outbox/organization-outbox.publisher.ts
// NEW FILE
// ============================================================================

import * as Outbox
from "../../../../platform/outbox/outbox.service.js";

import { OrganizationAggregate }
from "../../domain/aggregates/organization.aggregate.js";

export class OrganizationOutboxPublisher {

    async publish(

        aggregate: OrganizationAggregate

    ) {

        const events =

            aggregate.pullEvents();

        for (const event of events) {

            await Outbox.publish(

                event

            );

        }

    }

}
