// ============================================================================
// FILE: /backend/src/kernel/application/event-handler.ts
// NEW FILE
// ============================================================================

import { DomainEvent }

from "../domain/domain-event.js";

export interface EventHandler<T extends DomainEvent> {

    handle(

        event: T

    ): Promise<void>;

}
