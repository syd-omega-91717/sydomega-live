// ============================================================================
// FILE: /backend/src/platform/events/outbox.repository.ts
// NEW FILE
// ============================================================================

import { SupabaseProvider }

from "../persistence/supabase.provider.js";

import type {

    OutboxEvent

}

from "./outbox.entity.js";

export class OutboxRepository {

    private readonly provider =

        new SupabaseProvider<OutboxEvent>(

            "outbox_events"

        );

    public create(

        event: OutboxEvent

    ) {

        return this.provider.create(

            event

        );

    }

    public pending() {

        return this.provider.findMany({

            status: "pending"

        });

    }

    public update(

        id: string,

        payload: Partial<OutboxEvent>

    ) {

        return this.provider.update(

            id,

            payload

        );

    }

}

export default new OutboxRepository();
