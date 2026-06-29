// ============================================================================
// FILE: /backend/src/kernel/application/default-event-bus.ts
// NEW FILE
// ============================================================================

import { DomainEvent } from "../domain/domain-event.js";
import { EventHandler } from "./event-handler.js";

export class DefaultEventBus {

    private readonly handlers = new Map<
        string,
        EventHandler<any>[]
    >();

    subscribe<T extends DomainEvent>(

        event: string,

        handler: EventHandler<T>

    ) {

        const existing =

            this.handlers.get(event) ?? [];

        existing.push(handler);

        this.handlers.set(event, existing);

    }

    async publish(event: DomainEvent) {

        const handlers =

            this.handlers.get(event.eventName) ?? [];

        for (const handler of handlers) {

            await handler.handle(event);

        }

    }

}
