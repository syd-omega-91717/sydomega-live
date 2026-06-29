// ============================================================================
// FILE: /backend/src/kernel/domain/aggregate-root.ts
// NEW FILE
// ============================================================================

import { DomainEvent } from "./domain-event.js";

export abstract class AggregateRoot {

    private readonly events: DomainEvent[] = [];

    protected addDomainEvent(
        event: DomainEvent
    ): void {

        this.events.push(event);

    }

    public pullDomainEvents(): DomainEvent[] {

        const events = [...this.events];

        this.events.length = 0;

        return events;

    }

}
