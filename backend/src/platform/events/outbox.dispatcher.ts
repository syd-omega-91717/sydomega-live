// ============================================================================
// FILE: /backend/src/platform/events/outbox.dispatcher.ts
// NEW FILE
// ============================================================================

import eventBus from "./event-bus.js";

import repository

from "./outbox.repository.js";

class OutboxDispatcher {

    public async dispatch(): Promise<void> {

        const events =

            await repository.pending();

        for (

            const event

            of events

        ) {

            try {

                await eventBus.publish({

                    id: event.id,

                    name: event.eventName,

                    aggregateId: event.aggregateId,

                    occurredAt: event.createdAt,

                    payload: event.payload

                });

                await repository.update(

                    event.id,

                    {

                        status: "published",

                        publishedAt: new Date()

                    }

                );

            }

            catch {

                await repository.update(

                    event.id,

                    {

                        retryCount:

                            event.retryCount + 1,

                        status: "failed"

                    }

                );

            }

        }

    }

}

export default new OutboxDispatcher();
