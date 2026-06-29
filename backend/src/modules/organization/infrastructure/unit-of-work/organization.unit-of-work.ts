// ============================================================================
// FILE: /backend/src/modules/organization/infrastructure/unit-of-work/organization.unit-of-work.ts
// NEW FILE
// ============================================================================

import { SupabaseOrganizationRepository }
from "../persistence/organization.repository.supabase.js";

import { OrganizationOutboxPublisher }
from "../outbox/organization-outbox.publisher.js";

import { OrganizationAggregate }
from "../../domain/aggregates/organization.aggregate.js";

export class OrganizationUnitOfWork {

    constructor(

        private readonly repository =
            new SupabaseOrganizationRepository(),

        private readonly outbox =
            new OrganizationOutboxPublisher()

    ) {}

    async commit(

        aggregate: OrganizationAggregate

    ) {

        await this.repository.save(

            aggregate

        );

        await this.outbox.publish(

            aggregate

        );

    }

}
