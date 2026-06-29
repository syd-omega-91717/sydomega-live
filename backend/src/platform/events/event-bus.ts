// ============================================================================
// FILE: /backend/src/platform/events/event-bus.ts
// NEW FILE
// ============================================================================

import type {

    DomainEvent

}

from "./domain-event.interface.js";

export interface EventHandler {

    handle(

        event: DomainEvent

    ): Promise<void>;

}

class EventBus {

    private readonly handlers =

        new Map<

            string,

            EventHandler[]

        >();

    public subscribe(

        eventName: string,

        handler: EventHandler

    ) {

        const handlers =

            this.handlers.get(

                eventName

            ) ?? [];

        handlers.push(handler);

        this.handlers.set(

            eventName,

            handlers

        );

    }

    public async publish(

        event: DomainEvent

    ) {

        const handlers =

            this.handlers.get(

                event.name

            ) ?? [];

        for (

            const handler

            of handlers

        ) {

            await handler.handle(

                event

            );

        }

    }

}

export default new EventBus();
