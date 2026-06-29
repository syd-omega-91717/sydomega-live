// ============================================================================
// FILE: /backend/src/platform/events/outbox.scheduler.ts
// NEW FILE
// ============================================================================

import dispatcher

from "./outbox.dispatcher.js";

export function startOutboxScheduler() {

    setInterval(

        async () => {

            await dispatcher.dispatch();

        },

        2000

    );

}
