// ============================================================================
// FILE: /backend/src/scheduler/access.scheduler.js
// NEW FILE
// ============================================================================

import { expireAll } from "../services/access.service.js";

let scheduler = null;

async function execute() {

    try {

        await expireAll();

    }

    catch (error) {

        console.error("[Access Scheduler]", error);

    }

}

export function startAccessScheduler() {

    if (scheduler) {

        return scheduler;

    }

    execute();

    scheduler = setInterval(execute, 60000);

    console.log("✓ Access Scheduler Started");

    return scheduler;

}

export function stopAccessScheduler() {

    if (!scheduler) return;

    clearInterval(scheduler);

    scheduler = null;

}
